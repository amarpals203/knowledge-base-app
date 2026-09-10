import React, { useState, useEffect } from "react";
import { LayoutDashboard, FileText, Tag, Clock, Bot, Plus, Search, Trash2, Archive, Edit3, Check, Play, Pause, Send, Hash } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("Notes");
  const [notes, setNotes] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [standaloneTagName, setStandaloneTagName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All tags");
  const [selectedPriority, setSelectedPriority] = useState("All priorities");
  const [showArchived, setShowArchived] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const [activeTimerId, setActiveTimerId] = useState(null);
  const [chatQuery, setChatQuery] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchNotes = async () => {
    try {
      const params = new URLSearchParams({
        archived: showArchived,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedTag !== "All tags" && { tag: selectedTag }),
        ...(selectedPriority !== "All priorities" && { priority: selectedPriority }),
      });
      const res = await fetch(`/api/notes/?${params}`);
      if (!res.ok) throw new Error("Server error fetching notes");
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/notes/tags/list");
      if (res.ok) {
        const data = await res.json();
        setTagsList(data);
      }
    } catch (err) {
      console.error("Tags fetch error:", err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [searchQuery, selectedTag, selectedPriority, showArchived]);

  useEffect(() => {
    fetchTags();
  }, [notes]);

  useEffect(() => {
    let interval = null;
    if (activeTimerId !== null) {
      interval = setInterval(() => {
        setNotes((prevNotes) =>
          prevNotes.map((n) =>
            n.id === activeTimerId ? { ...n, time_spent_seconds: (n.time_spent_seconds || 0) + 1 } : n
          )
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimerId]);

  const handleToggleTimer = async (note) => {
    if (activeTimerId === note.id) {
      setActiveTimerId(null);
      await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time_spent_seconds: note.time_spent_seconds }),
      });
    } else {
      setActiveTimerId(note.id);
    }
  };

  const handleCreateNote = async () => {
    if (!newTitle.trim()) return;
    const tagsArray = newTagInput
      .split(",")
      .map((t) => t.trim().replace("#", ""))
      .filter(Boolean);

    try {
      const res = await fetch("/api/notes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: "++COOL++",
          priority: selectedPriority === "All priorities" ? "Lowest" : selectedPriority,
          tags: tagsArray,
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewTagInput("");
        await fetchNotes();
        await fetchTags();
      }
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  const handleCreateStandaloneTag = async () => {
    if (!standaloneTagName.trim()) return;
    try {
      const res = await fetch("/api/notes/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: standaloneTagName }),
      });
      if (res.ok) {
        setStandaloneTagName("");
        fetchTags();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTag = async (e, tagName) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notes/tags/${encodeURIComponent(tagName)}`, { method: "DELETE" });
      if (selectedTag === tagName) setSelectedTag("All tags");
      fetchTags();
      fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editTitle.trim()) return;
    await fetch(`/api/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle }),
    });
    setEditingId(null);
    fetchNotes();
  };

  const handleToggleArchive = async (note) => {
    await fetch(`/api/notes/${note.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !note.archived }),
    });
    fetchNotes();
  };

  const handleDeleteNote = async (id) => {
    if (activeTimerId === id) setActiveTimerId(null);
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    fetchNotes();
    fetchTags();
  };

  const handleSendMessage = async () => {
    if (!chatQuery.trim()) return;
    const userText = chatQuery;
    setChatMessages((prev) => [...prev, { role: "user", text: userText }]);
    setChatQuery("");
    setIsSearching(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userText }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply, context: data.context },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error contacting knowledge assistant." },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatSeconds = (sec = 0) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const totalCount = notes.length;
  const activeCount = notes.filter((n) => !n.archived).length;
  const archivedCount = notes.filter((n) => n.archived).length;
  const totalSeconds = notes.reduce((acc, curr) => acc + (curr.time_spent_seconds || 0), 0);

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <header className="flex items-center gap-6 px-10 py-5 border-b border-gray-100">
        <h1 className="font-bold text-lg text-gray-900 mr-4">Knowledge Base</h1>
        <nav className="flex items-center gap-2">
          {[
            { id: "Dashboard", icon: LayoutDashboard },
            { id: "Notes", icon: FileText },
            { id: "Tags", icon: Tag },
            { id: "Time", icon: Clock },
            { id: "Assistant", icon: Bot },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  isActive ? "bg-black text-white" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <Icon size={16} />
                {item.id}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{activeTab}</h2>

        {/* DASHBOARD TAB */}
        {activeTab === "Dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase">Total Notes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalCount}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase">Active</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{activeCount}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase">Tags</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{tagsList.length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase">Total Time</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatSeconds(totalSeconds)}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Notes</h3>
              {notes.length === 0 ? (
                <p className="text-sm text-gray-400">No notes yet.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notes.map((note) => (
                    <div key={note.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{note.title}</p>
                        <div className="flex gap-1.5 mt-1">
                          {note.tags?.map((t) => (
                            <span key={t} className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md font-medium">
                        {note.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === "Notes" && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="New note title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNote()}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <input
                  type="text"
                  placeholder="Tags (e.g. work, sports)..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNote()}
                  className="w-48 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <button
                  onClick={handleCreateNote}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition"
                >
                  <Plus size={16} />
                  Create
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>

                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-600 focus:outline-none"
                >
                  <option>All tags</option>
                  {tagsList.map((t) => (
                    <option key={t.id} value={t.name}>
                      #{t.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-600 focus:outline-none"
                >
                  <option>All priorities</option>
                  <option>Lowest</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>

                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="rounded border-gray-300 text-black focus:ring-0"
                  />
                  Archived
                </label>
              </div>
            </div>

            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-2">
                    {editingId === note.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-4">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-lg font-bold text-gray-900 w-full"
                          autoFocus
                        />
                        <button onClick={() => handleSaveEdit(note.id)} className="p-1 hover:text-green-600 text-gray-500">
                          <Check size={18} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{note.title}</h3>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {note.tags.map((t) => (
                              <button
                                key={t}
                                onClick={() => setSelectedTag(t)}
                                className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded transition"
                              >
                                #{t}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded">
                        {note.priority}
                      </span>
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditTitle(note.title);
                        }}
                        className="text-gray-400 hover:text-gray-700 p-1"
                        title="Edit title"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleArchive(note)}
                        className="text-gray-400 hover:text-gray-700 p-1"
                        title={note.archived ? "Unarchive" : "Archive"}
                      >
                        <Archive size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Delete note"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{note.content}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* TAGS TAB */}
        {activeTab === "Tags" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-3">
              <input
                type="text"
                placeholder="New tag name..."
                value={standaloneTagName}
                onChange={(e) => setStandaloneTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateStandaloneTag()}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button
                onClick={handleCreateStandaloneTag}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition"
              >
                <Plus size={16} />
                Add Tag
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {tagsList.length === 0 ? (
                <div className="col-span-full py-16 text-center text-gray-400 text-sm">
                  No tags created yet. Add a tag above or tag a note during creation!
                </div>
              ) : (
                tagsList.map((tag) => (
                  <div
                    key={tag.id}
                    onClick={() => {
                      setSelectedTag(tag.name);
                      setActiveTab("Notes");
                    }}
                    className="bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-4 shadow-sm flex items-center justify-between cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-2">
                      <Hash size={16} className="text-gray-400" />
                      <span className="font-semibold text-gray-800">{tag.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                        {tag.count} {tag.count === 1 ? "note" : "notes"}
                      </span>
                      <button
                        onClick={(e) => handleDeleteTag(e, tag.name)}
                        className="text-gray-300 hover:text-red-500 p-1 transition opacity-0 group-hover:opacity-100"
                        title="Delete tag"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TIME TRACKER TAB */}
        {activeTab === "Time" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">Track time actively spent on each note:</p>
            {notes.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400">
                No notes available to track time on.
              </div>
            ) : (
              notes.map((note) => {
                const isRunning = activeTimerId === note.id;
                return (
                  <div
                    key={note.id}
                    className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-gray-900">{note.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 font-mono">
                        Time: {formatSeconds(note.time_spent_seconds || 0)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleTimer(note)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                        isRunning
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                      }`}
                    >
                      {isRunning ? <Pause size={16} /> : <Play size={16} />}
                      {isRunning ? "Stop" : "Start"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ASSISTANT (RAG) TAB */}
        {activeTab === "Assistant" && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {chatMessages.length === 0 ? (
                <div className="text-center py-24 text-gray-400 text-sm">
                  Ask questions to query and search your notes through the RAG assistant.
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-4 py-2.5 rounded-xl max-w-lg text-sm ${
                        msg.role === "user" ? "bg-black text-white" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {msg.context && (
                      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 text-xs text-gray-600 rounded-lg max-w-lg whitespace-pre-wrap">
                        <strong className="block mb-1 text-gray-700">Retrieved Context:</strong>
                        {msg.context}
                      </div>
                    )}
                  </div>
                ))
              )}
              {isSearching && <p className="text-xs text-gray-400 italic">Searching knowledge base...</p>}
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-100 mt-4">
              <input
                type="text"
                placeholder="Ask assistant about notes..."
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
