import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../api';
import GroupChat from '../components/GroupChat';

export default function ForumPage({ active, user, onLogin }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const firstPage = useRef(0);

  const load = useCallback(async (p) => {
    setLoading(true);
    setError('');
    try {
      let list = await api.getPosts(p);
      // If the API is 1-indexed, page 0 comes back empty; retry with page 1 once.
      if (p === 0 && list.length === 0 && firstPage.current === 0) {
        const next = await api.getPosts(1);
        if (next.length > 0) {
          firstPage.current = 1;
          list = next;
          p = 1;
        }
      }
      setPosts(list);
      setPage(p);
    } catch (err) {
      setError(err.message || 'Could not load posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  // Runs an API action, then refreshes the current page. Returns true on success.
  async function act(fn, goToFirst = false) {
    setError('');
    try {
      const ok = await fn();
      if (!ok) {
        setError('That did not work. Please try again.');
        return false;
      }
      await load(goToFirst ? firstPage.current : page);
      return true;
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      return false;
    }
  }

  function send(text, postId) {
    if (postId != null) return act(() => api.replyPost(user.id, postId, text));
    return act(() => api.newPost(user.id, text), true);
  }

  // Keep the current page when switching between the chat and authentication.
  if (!active) return null;

  return (
    <div className="chat-page">
      <GroupChat
        posts={posts}
        user={user}
        loading={loading}
        error={error}
        page={page}
        firstPage={firstPage.current}
        onPageChange={load}
        onSend={send}
        onDeletePost={(id) => act(() => api.deletePost(id))}
        onDeleteReply={(id) => act(() => api.deleteReply(id))}
        onLogin={onLogin}
      />
    </div>
  );
}
