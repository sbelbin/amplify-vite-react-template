export enum PlaybackSources {
  None      = 0,
  Video     = 1,
  Chart     = 2
}

export enum PlaybackModes {
  None      = PlaybackSources.None,
  Video     = PlaybackSources.Video,
  Chart     = PlaybackSources.Chart,
  Suspended = 64
}

export enum SuspendPlaybackState {
  On  = PlaybackModes.Suspended,
  Off = 0
}
