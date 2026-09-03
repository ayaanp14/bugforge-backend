import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const AUTHOR_SELECT = { id: true, name: true, username: true, avatar_url: true } as const;

/** Feed page size cap. */
const MAX_TAKE = 30;

// GET /api/community/feed?scope=all|following&skip=0&take=20
router.get("/feed", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const scope = req.query.scope === "following" ? "following" : "all";
    const skip = Math.max(0, parseInt(String(req.query.skip ?? "0"), 10) || 0);
    const take = Math.min(MAX_TAKE, Math.max(1, parseInt(String(req.query.take ?? "20"), 10) || 20));

    let where = {};
    if (scope === "following") {
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      where = { userId: { in: [...following.map((f) => f.followingId), userId] } };
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        user: { select: AUTHOR_SELECT },
        _count: { select: { comments: true, likes: true } },
      },
    });

    const ids = posts.map((p) => p.id);
    const [myLikes, myFollows] = await Promise.all([
      ids.length
        ? prisma.postLike.findMany({ where: { userId, postId: { in: ids } }, select: { postId: true } })
        : Promise.resolve([]),
      prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } }),
    ]);
    const liked = new Set(myLikes.map((l) => l.postId));
    const followed = new Set(myFollows.map((f) => f.followingId));

    res.json(
      posts.map((p) => ({
        id: p.id,
        type: p.type,
        content: p.content,
        meta: p.meta,
        createdAt: p.createdAt,
        author: p.user,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        likedByMe: liked.has(p.id),
        followingAuthor: followed.has(p.userId),
        mine: p.userId === userId,
      }))
    );
  } catch (err) {
    console.error("GET /api/community/feed error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/posts — a status/story, or an achievement share (meta set)
router.post("/posts", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { content, meta } = req.body as { content?: string; meta?: Record<string, unknown> };
    const text = (content ?? "").trim();
    const hasAchievement = meta && typeof meta === "object" && typeof meta.title === "string";
    if (!text && !hasAchievement) {
      res.status(400).json({ error: "Write something first" });
      return;
    }
    if (text.length > 2000) {
      res.status(400).json({ error: "Posts are limited to 2000 characters" });
      return;
    }

    const post = await prisma.post.create({
      data: {
        userId,
        type: hasAchievement ? "achievement" : "status",
        content: text,
        meta: hasAchievement ? (meta as object) : {},
      },
      include: { user: { select: AUTHOR_SELECT }, _count: { select: { comments: true, likes: true } } },
    });

    res.json({
      id: post.id,
      type: post.type,
      content: post.content,
      meta: post.meta,
      createdAt: post.createdAt,
      author: post.user,
      likeCount: 0,
      commentCount: 0,
      likedByMe: false,
      followingAuthor: false,
      mine: true,
    });
  } catch (err) {
    console.error("POST /api/community/posts error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/community/posts/:id — own posts only
router.delete("/posts/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const id = String(req.params.id);
    const post = await prisma.post.findUnique({ where: { id }, select: { userId: true } });
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    if (post.userId !== userId) {
      res.status(403).json({ error: "You can only delete your own posts" });
      return;
    }
    await prisma.post.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/community/posts/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/posts/:id/like — toggle
router.post("/posts/:id/like", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.id);
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      try {
        await prisma.postLike.create({ data: { postId, userId } });
      } catch (e: any) {
        if (e?.code !== "P2002") throw e; // double-click race: already liked
      }
    }
    const likeCount = await prisma.postLike.count({ where: { postId } });
    res.json({ liked: !existing, likeCount });
  } catch (err) {
    console.error("POST /api/community/posts/:id/like error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/posts/:id/comments
router.get("/posts/:id/comments", requireAuth, async (req, res) => {
  try {
    const postId = String(req.params.id);
    const comments = await prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { user: { select: AUTHOR_SELECT } },
    });
    res.json(
      comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: c.user,
        mine: c.userId === req.user!.userId,
      }))
    );
  } catch (err) {
    console.error("GET /api/community/posts/:id/comments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/posts/:id/comments
router.post("/posts/:id/comments", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const postId = String(req.params.id);
    const text = String((req.body as { content?: string }).content ?? "").trim();
    if (!text) {
      res.status(400).json({ error: "Write a comment first" });
      return;
    }
    if (text.length > 1000) {
      res.status(400).json({ error: "Comments are limited to 1000 characters" });
      return;
    }
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, userId: true } });
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    const comment = await prisma.postComment.create({
      data: { postId, userId, content: text },
      include: { user: { select: AUTHOR_SELECT } },
    });

    // Quiet heads-up for the author (not for self-comments)
    if (post.userId !== userId) {
      void prisma.notification
        .create({
          data: {
            userId: post.userId,
            type: "post_comment",
            title: "New comment on your post",
            body: `${comment.user.username || comment.user.name || "Someone"} commented: “${text.slice(0, 80)}${text.length > 80 ? "…" : ""}”`,
            href: "/community",
          },
        })
        .catch(() => {});
    }

    res.json({ id: comment.id, content: comment.content, createdAt: comment.createdAt, author: comment.user, mine: true });
  } catch (err) {
    console.error("POST /api/community/posts/:id/comments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/community/follow/:userId — toggle follow
router.post("/follow/:userId", requireAuth, async (req, res) => {
  try {
    const followerId = req.user!.userId;
    const followingId = String(req.params.userId);
    if (followerId === followingId) {
      res.status(400).json({ error: "You can't follow yourself" });
      return;
    }
    const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true, username: true } });
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
    } else {
      try {
        await prisma.follow.create({ data: { followerId, followingId } });
      } catch (e: any) {
        if (e?.code !== "P2002") throw e;
      }
      const me = await prisma.user.findUnique({ where: { id: followerId }, select: { username: true, name: true } });
      void prisma.notification
        .create({
          data: {
            userId: followingId,
            type: "new_follower",
            title: "You have a new follower",
            body: `${me?.username || me?.name || "Someone"} started following you.`,
            href: "/community",
          },
        })
        .catch(() => {});
    }
    const followers = await prisma.follow.count({ where: { followingId } });
    res.json({ following: !existing, followers });
  } catch (err) {
    console.error("POST /api/community/follow/:userId error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/me — my social card (followers/following/posts counts)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const [followers, following, posts] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.post.count({ where: { userId } }),
    ]);
    res.json({ followers, following, posts });
  } catch (err) {
    console.error("GET /api/community/me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/community/suggestions — most active users I don't follow yet
router.get("/suggestions", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const exclude = [userId, ...following.map((f) => f.followingId)];
    const users = await prisma.user.findMany({
      where: { id: { notIn: exclude } },
      orderBy: { xp: "desc" },
      take: 5,
      select: { ...AUTHOR_SELECT, xp: true },
    });
    res.json(users);
  } catch (err) {
    console.error("GET /api/community/suggestions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
