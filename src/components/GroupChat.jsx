import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';

const TONES = ['blue', 'lilac', 'yellow', 'green'];

function timelineFor(posts) {
  return [...posts].reverse().flatMap((post, index) => {
    const tone = TONES[index % TONES.length];
    return [
      { item: post, post, isReply: false, tone, date: post.date },
      ...post.replies.map((item) => ({ item, post, isReply: true, tone, date: item.date || post.date })),
    ];
  }).sort((a, b) => a.date.localeCompare(b.date));
}

const postElementId = (id) => `chat-post-${id}`;

function Message({ entry, user, disabled, onReply, onDelete, onJumpToPost }) {
  const { item, post, isReply, tone } = entry;
  const own = !!user && item.userId != null && String(item.userId) === String(user.id);
  return (
    <li
      className={`message tone-${tone}${own ? ' message-own' : ''}`}
      id={isReply ? undefined : postElementId(post.id)}
      tabIndex={isReply ? undefined : -1}
    >
      {!own && (
        <span className="avatar" aria-hidden="true">{item.username.charAt(0).toUpperCase()}</span>
      )}
      <div className="message-body">
        <div className="message-meta">
          <strong>{own ? 'You' : item.username}</strong>
          {item.date && <span>{item.date}</span>}
        </div>
        <div className="message-bubble">
          {isReply && (
            <button className="message-quote" type="button" onClick={() => onJumpToPost(post.id)}>
              <strong>Reply to {post.username}</strong>
              <span className="message-preview">{post.text}</span>
            </button>
          )}
          <p className="message-text">{item.text}</p>
        </div>
        {user && (
          <div className="message-actions">
            {!isReply && (
              <button className="message-reply" type="button" disabled={disabled} onClick={() => onReply(post.id)}>
                Reply
              </button>
            )}
            {own && (
              <button className="icon-btn" type="button" disabled={disabled} aria-label={isReply ? 'Delete reply' : 'Delete post'}
                onClick={() => onDelete(item.id, isReply)}>
                <Icon.Trash />
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export default function GroupChat({
  posts, user, loading, error, page, firstPage, onPageChange, onSend, onDeletePost, onDeleteReply, onLogin,
}) {
  const messages = useMemo(() => timelineFor(posts), [posts]);
  const [draft, setDraft] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [busy, setBusy] = useState(false);
  const timeline = useRef(null);
  const input = useRef(null);
  const [sentCount, setSentCount] = useState(0);
  const hasMessages = messages.length > 0;
  const replyTo = posts.find((post) => post.id === replyToId);
  const disabled = busy || loading;

  useLayoutEffect(() => {
    if (hasMessages) timeline.current.scrollTop = timeline.current.scrollHeight;
  }, [hasMessages, page, sentCount]);

  function startReply(id) {
    setReplyToId(id);
    input.current.focus();
  }

  function jumpToPost(id) {
    const container = timeline.current;
    const target = document.getElementById(postElementId(id));
    if (!container?.contains(target)) return;

    const viewport = container.getBoundingClientRect();
    const message = target.getBoundingClientRect();
    target.focus({ preventScroll: true });
    container.scrollTo({
      top: container.scrollTop + message.top - viewport.top - Math.max(10, (viewport.height - message.height) / 2),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }

  function changePage(nextPage) {
    setReplyToId(null);
    onPageChange(nextPage);
  }

  async function send(event) {
    event.preventDefault();
    if (disabled || !draft.trim()) return;
    setBusy(true);
    try {
      if (await onSend(draft.trim(), replyTo?.id)) {
        setDraft('');
        setSentCount((count) => count + 1);
        setReplyToId(null);
      }
    } finally {
      setBusy(false);
      input.current?.focus();
    }
  }

  async function remove(id, isReply) {
    setBusy(true);
    try {
      await (isReply ? onDeleteReply(id) : onDeletePost(id));
      if (!isReply && replyToId === id) setReplyToId(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="group-chat" aria-labelledby="chat-title">
      <div className="chat-heading">
        <span className="chat-icon" aria-hidden="true"><Icon.Brand /></span>
        <div>
          <h1 id="chat-title">Group chat</h1>
          <p className="muted">Public discussion</p>
        </div>
      </div>
      <nav className="chat-pagination" aria-label="Message pages">
        <button className="btn-dashed" type="button" disabled={disabled || page <= firstPage}
          onClick={() => changePage(page - 1)}>
          Newer
        </button>
        <span className="muted">Page {page - firstPage + 1}</span>
        <button className="btn-dashed" type="button" disabled={disabled || posts.length === 0}
          onClick={() => changePage(page + 1)}>
          Older
        </button>
      </nav>
      {error && <p className="error chat-error" role="alert">{error}</p>}
      <div className="timeline" ref={timeline} tabIndex={0} role="region" aria-label="Chat messages" aria-busy={loading}>
        {messages.length ? (
          <ol className="message-list">
            {messages.map((entry) => (
              <Message
                key={entry.isReply ? `reply-${entry.post.id}-${entry.item.id}` : `post-${entry.item.id}`}
                entry={entry}
                user={user}
                disabled={disabled}
                onReply={startReply}
                onDelete={remove}
                onJumpToPost={jumpToPost}
              />
            ))}
          </ol>
        ) : (
          <p className="empty">{loading ? 'Loading messages…' : 'No messages on this page.'}</p>
        )}
      </div>
      {user ? (
        <form className="chat-composer" onSubmit={send}>
          {replyTo && (
            <div className="reply-context">
              <div>
                <strong>Replying to {replyTo.username}</strong>
                <p>{replyTo.text}</p>
              </div>
              <button className="message-reply" type="button" onClick={() => setReplyToId(null)} disabled={busy}>
                Cancel reply
              </button>
            </div>
          )}
          <div className="compose-row">
            <textarea
              ref={input}
              rows={1}
              aria-label={replyTo ? 'Write a reply' : 'Write a message'}
              placeholder={replyTo ? 'Write a reply…' : 'Write a message…'}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
                event.preventDefault();
                event.currentTarget.form.requestSubmit();
              }}
              readOnly={busy}
            />
            <button className="btn" disabled={disabled || !draft.trim()}>Send</button>
          </div>
        </form>
      ) : (
        <div className="chat-composer chat-guest">
          <p>Log in to join the conversation.</p>
          <button className="btn" type="button" onClick={onLogin}>Log in</button>
        </div>
      )}
    </main>
  );
}
