export enum PlaybackSource {
  None      = 0,
  Video     = 1,
  Chart     = 2
}

/**
 * Consider these as bit masks.
 *
 * The suspended state can be active whether if the playing is on or off.
 */
export enum PlaybackState {
  Stopped   = 0,
  Playing   = 1,
  Paused    = 2
}

export enum SuspendPlaybackState {
  Off = 0,
  On  = 1
}
