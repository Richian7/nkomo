import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, ImagePlus } from "lucide-react";
import toast from "react-hot-toast";

function CreateGroupModal() {
  const {
    showCreateGroupModal,
    closeCreateGroupModal,
    allContacts,
    getAllContacts,
    createGroup,
    groups,
    setGroups,
    setSelectedGroup,
  } = useChatStore();

  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false); // ✅ Loading state

  useEffect(() => {
    if (showCreateGroupModal) getAllContacts();
  }, [showCreateGroupModal, getAllContacts]);

  if (!showCreateGroupModal) return null;

  const toggleMember = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return toast.error("Please enter a group name");
    if (selectedMembers.length === 0)
      return toast.error("Please select at least one member");

    const formData = new FormData();
    formData.append("name", groupName);
    formData.append("members", JSON.stringify(selectedMembers));
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      setIsCreating(true);
      const newGroup = await createGroup(formData);

      toast.success("Group created successfully!");
      setGroups([newGroup, ...groups]);
      setSelectedGroup(newGroup);

      // Reset modal state
      setGroupName("");
      setSelectedMembers([]);
      setAvatarFile(null);
      setAvatarPreview(null);

      closeCreateGroupModal();
    } catch (error) {
      console.error("Create group error:", error);

      // Show backend error if available
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to create group";
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900/80 w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-700/50">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-cyan-300">Create Group</h2>
          <button
            onClick={closeCreateGroupModal}
            className="text-slate-400 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* Group Image */}
        <div className="flex flex-col items-center mb-5">
          <label className="cursor-pointer">
            <div className="w-24 h-24 bg-slate-700/40 rounded-full flex items-center justify-center overflow-hidden border border-slate-600 hover:border-cyan-400 transition">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Group Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImagePlus size={40} className="text-slate-400" />
              )}
            </div>
            <input type="file" className="hidden" onChange={handleImage} />
          </label>
          <p className="text-slate-400 text-sm mt-2">Upload Group Picture</p>
        </div>

        {/* Group Name */}
        <div className="mb-5">
          <label className="text-slate-300 text-sm">Group Name</label>
          <input
            type="text"
            className="w-full mt-1 p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 outline-none focus:border-cyan-400"
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        {/* Members List */}
        <div>
          <p className="text-slate-300 text-sm mb-2">Select Members</p>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {allContacts.map((user) => {
              const isSelected = selectedMembers.includes(user._id);
              return (
                <div
                  key={user._id}
                  onClick={() => toggleMember(user._id)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition
                    ${isSelected
                      ? "bg-cyan-600/70 border-2 border-cyan-400"
                      : "bg-slate-800/40 hover:bg-slate-700/40 border border-transparent"}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="checkbox checkbox-info"
                  />
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center flex-shrink-0">
                    {user.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg text-cyan-300 font-semibold">
                        {user.fullName?.[0]}
                      </span>
                    )}
                  </div>
                  <span className="text-white font-medium truncate max-w-[150px]">
                    {user.fullName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className={`w-full mt-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition ${
            isCreating ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isCreating ? "Creating..." : "Create Group"}
        </button>
      </div>
    </div>
  );
}

export default CreateGroupModal;
