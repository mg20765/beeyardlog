// Lets several open copies of the app (the installed app and a browser tab,
// for example) tell each other when the log has changed, so none of them keeps
// showing, backing up or editing a stale list.
//
// `Channel` is passed in so this can be unit tested; it defaults to the
// browser's BroadcastChannel. Where that doesn't exist, this does nothing and
// the app falls back to refreshing when it comes back into view.
const CHANNEL_NAME = "beeyardlog-sync";

const NOTHING = { notify() {}, close() {} };

export function createSync(onChange, Channel = globalThis.BroadcastChannel) {
  if (!Channel) return NOTHING;
  let channel;
  try {
    channel = new Channel(CHANNEL_NAME);
    channel.onmessage = () => onChange();
  } catch {
    return NOTHING;
  }
  return {
    // A channel never delivers a message back to the copy that sent it.
    notify() {
      try {
        channel.postMessage("changed");
      } catch {
        // Closed or unavailable: the other copies will catch up when shown.
      }
    },
    close() {
      try {
        channel.close();
      } catch {
        // ignore
      }
    },
  };
}
