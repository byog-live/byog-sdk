import { Socket, Channel, Presence } from 'phoenix';
import uid from 'uid';

export type DevOpts = Partial<{
  domain: string;
  gameId: string;
  userId: string;
  isPlayer: boolean;
}>;

const SDK: {
  channel?: Channel;
  userId?: string;
  gameId?: string;
  presence?: Presence;
  readonly dev: (gameDef: string, opts?: DevOpts) => void;
  readonly devLocal: (gameDef: string, opts?: DevOpts) => void;
  readonly trigger: (event: string, payload: object) => void;
  readonly chat: (text: string) => void;
  readonly sync: (payload: any) => void;
  handlePush: (push: { event: string; payload: object }) => void;
  handleChat: (chat: { text: string; uid: string }) => void;
  handleSync: (payload: any) => void;
  handleState: (state: string) => void;
  handlePresence: (presences: { id: string; metas: any[] }[]) => void;
} = {
  /** @internal */
  devLocal(gameDef: string, opts?: DevOpts) {
    this.dev(gameDef, { domain: 'dev.localhost', ...opts });
  },

  dev(gameDef: string, { domain, gameId, userId, isPlayer }: DevOpts = {}) {
    const location = document.location.toString();
    const params = new URL(location).searchParams;

    userId = userId || uid(16);
    gameId = gameId || params.get('gid') || uid(12);
    domain = domain || 'dev.byog.live';

    history.replaceState(
      history.state,
      document.title,
      `${document.location.pathname}?gid=${gameId}`,
    );

    const socket = new Socket(`wss://${domain}/socket`, { params: { userId } });
    socket.connect();

    const channel = socket.channel(`game:${gameId}`, {
      gameDef,
      isPlayer: isPlayer ?? true,
    });

    channel.join();

    channel.on('push', (push: { event: string; payload: object }) =>
      this.handlePush(push),
    );
    channel.on('chat', (chat: { text: string; uid: string }) =>
      this.handleChat(chat),
    );
    channel.on('sync', ({ payload }: { payload: any }) =>
      this.handleSync(payload),
    );
    channel.on('state', ({ payload }: { payload: string }) =>
      this.handleState(payload),
    );

    this.presence = new Presence(channel);
    this.presence.onSync(() => {
      this.handlePresence(
        this.presence!.list((key, { metas }) => ({ id: key, metas })),
      );
    });

    this.channel = channel;
    this.userId = userId;
    this.gameId = gameId;
  },

  trigger(event: string, payload: object) {
    this.channel!.push('trigger', { event, payload });
  },

  chat(text: string) {
    this.channel!.push('chat', { text });
  },

  sync(payload: any) {
    this.channel!.push('sync', { payload });
  },

  handlePush({ event, payload }) {
    console.log(`Received event "${event}" with ${JSON.stringify(payload)}`);
  },

  handleChat({ text, uid }) {
    console.log(`User#${uid} said ${text}`);
  },

  handleSync(payload) {
    console.log(`Received sync object ${JSON.stringify(payload)}`);
  },

  handleState(state) {
    console.log(`Game is at state: ${state}`);
  },

  handlePresence(presences: { id: string; metas: any[] }[]) {
    console.log(`Presence update: ${JSON.stringify(presences)}`);
  },
};

export default SDK;
