// The Rooms screen reads this when it comes back from the lobby, to update the list
let pendingLeave = null;

export function setLobbyLeave(value) {
  pendingLeave = value;
}

export function takeLobbyLeave() {
  const value = pendingLeave;
  pendingLeave = null;
  return value;
}