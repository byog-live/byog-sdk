import { Socket, Channel } from 'phoenix';
import uid from 'uid';

const reg = /([\w-]+)\.stackblitz\.io/;

const SDK: {
  channel?: Channel;
  userId?: string;
  gameId?: string;
  readonly dev: (gameDef: string, local: boolean) => void;
  readonly trigger: (event: string, payload: object) => void;
  readonly chat: (text: string) => void;
  readonly sync: (payload: any) => void;
  handlePush: (push: { event: string; payload: object }) => void;
  handleChat: (chat: { text: string; uid: string }) => void;
  handleSync: (payload: any) => void;
  handleState: (state: string) => void;
} = {
  dev(gameDef: string, local = false) {
    const domain = local ? 'dev.localhost' : 'byog.live';
    const location = document.location.toString();
    const params = new URL(location).searchParams;
    const gameId = reg.exec(location)?.[1] || uid();
    const userId = uid(16);

    const socket = new Socket(`wss://${domain}/socket`);
    socket.connect();

    const channel = socket.channel(`game:${gameId}`, { userId, gameDef });
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
};

export default SDK;
