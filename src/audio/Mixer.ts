import type { AudioTrack } from "./types";

export class Mixer {
  private tracks: AudioTrack[];

  constructor(tracks: AudioTrack[] = []) {
    this.tracks = tracks.slice(0, 3);
  }

  getTracks() {
    return this.tracks.map((track) => ({ ...track }));
  }

  setTracks(tracks: AudioTrack[]) {
    this.tracks = tracks.slice(0, 3);
    return this.getTracks();
  }

  addTrack(track: AudioTrack) {
    if (this.tracks.some((item) => item.soundId === track.soundId)) return this.getTracks();
    if (this.tracks.length >= 3) return this.getTracks();
    this.tracks = [...this.tracks, track];
    return this.getTracks();
  }

  removeTrack(soundId: string) {
    this.tracks = this.tracks.filter((track) => track.soundId !== soundId);
    return this.getTracks();
  }

  updateTrack(soundId: string, patch: Partial<AudioTrack>) {
    this.tracks = this.tracks.map((track) => track.soundId === soundId ? { ...track, ...patch } : track);
    return this.getTracks();
  }
}
