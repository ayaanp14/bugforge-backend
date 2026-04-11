/**
 * In-memory store for room bans.
 * Bans are stored as a map of "roomId:userId" to the expiration timestamp.
 */
class BanStore {
  private bans: Map<string, number> = new Map();

  /**
   * Adds a ban for a user in a specific room.
   * @param roomId The ID of the room
   * @param userId The ID of the user to ban
   * @param durationMinutes Duration of the ban in minutes (default 5)
   */
  addBan(roomId: string, userId: string, durationMinutes: number = 5) {
    const key = `${roomId}:${userId}`;
    const expiresAt = Date.now() + durationMinutes * 60 * 1000;
    this.bans.set(key, expiresAt);
    
    // Auto-cleanup after duration to keep memory clean
    setTimeout(() => {
      if (this.bans.get(key) === expiresAt) {
        this.bans.delete(key);
      }
    }, durationMinutes * 60 * 1000 + 1000);
  }

  /**
   * Checks if a user is currently banned from a room.
   * @param roomId The ID of the room
   * @param userId The ID of the user
   * @returns true if banned, false otherwise
   */
  isBanned(roomId: string, userId: string): boolean {
    const key = `${roomId}:${userId}`;
    const expiresAt = this.bans.get(key);
    
    if (!expiresAt) return false;
    
    if (Date.now() > expiresAt) {
      this.bans.delete(key);
      return false;
    }
    
    return true;
  }
}

export const banStore = new BanStore();
