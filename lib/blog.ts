export async function getPosts() {
  const { posts } = await import("@/data/blog.json").then((m) => m.default)
  return posts
}