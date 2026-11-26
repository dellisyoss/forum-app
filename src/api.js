import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  responseType: 'text',
  // The PHP endpoints report the result in the response body.
  validateStatus: () => true,
});

async function call(file, { method = 'GET', data = {} } = {}) {
  const fields = new URLSearchParams(data);
  const requestData = method === 'GET'
    ? { params: fields }
    : {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: fields.toString(),
      };
  const { data: text } = await client.request({ url: file, method, ...requestData });
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Unexpected response from the server.');
  }
}

const isOk = (v) =>
  v === true ||
  (v && (v.success === true || v.success === 'true' || v.success === 1 || v.success === '1'));

const asList = (v) => (Array.isArray(v) ? v : []);

export function isValidUserId(id) {
  if (typeof id !== 'number' && typeof id !== 'string') return false;
  const value = Number(id);
  return Number.isSafeInteger(value) && value > 0;
}

function normalizeReply(r) {
  return {
    id: r.id,
    userId: r.user_id ?? r.userId ?? r.uid,
    username: r.user ?? r.username ?? r.name ?? 'Unknown',
    text: r.reply ?? r.text ?? '',
    date: r.date ?? r.created_at ?? r.timestamp ?? '',
  };
}

function normalizePost(p) {
  return {
    id: p.id,
    userId: p.user_id ?? p.userId ?? p.uid,
    username: p.user ?? p.username ?? p.name ?? 'Unknown',
    text: p.post ?? p.text ?? '',
    date: p.date ?? p.created_at ?? p.timestamp ?? '',
    replies: asList(p.reply ?? p.replies).map(normalizeReply),
  };
}

export async function getPosts(page) {
  const data = await call('forumGetPosts.php', { data: { page } });
  return asList(data).map(normalizePost);
}

function authFailed(data) {
  if (data === true) return false;
  return !data || typeof data !== 'object' || Boolean(data.error) ||
    (Object.hasOwn(data, 'success') && !isOk(data)) ||
    (Array.isArray(data) && data.length === 0);
}

function normalizeUser(data, username) {
  const details = data?.data ?? data;
  const record = Array.isArray(details) && details.length === 1 ? details[0] : details;
  const user = typeof record?.user === 'object' ? record.user : record;
  const id = [user?.id, user?.user_id, user?.uid, user?.userId, user?.userid, user?.userID]
    .find(isValidUserId);
  if (id === undefined) return null;
  const name = user.username ?? user.user;
  return { id, username: typeof name === 'string' && name ? name : username };
}

export async function createUser(username, password) {
  const data = await call('forumCreateUser.php', { method: 'POST', data: { username, password } });
  if (authFailed(data)) return null;
  return { user: normalizeUser(data, username) };
}

export async function login(username, password) {
  const data = await call('forumLogin.php', { method: 'POST', data: { username, password } });
  if (authFailed(data)) return null;
  const user = normalizeUser(data, username);
  if (!user) throw new Error('The forum server did not return a user ID.');
  return user;
}

export async function newPost(id, post) {
  return isOk(await call('forumNewPost.php', { method: 'POST', data: { id, post } }));
}

export async function deletePost(id) {
  return isOk(await call('forumDeletePost.php', { data: { id } }));
}

export async function replyPost(userId, postId, reply) {
  return isOk(
    await call('forumReplyPost.php', {
      method: 'POST',
      data: { user_id: userId, post_id: postId, reply },
    })
  );
}

export async function deleteReply(id) {
  return isOk(await call('forumDeleteReply.php', { data: { id } }));
}
