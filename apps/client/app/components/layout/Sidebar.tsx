'use client';
import { useWallet } from '@suiet/wallet-kit';
import { useState, useEffect } from 'react';
import { FiMenu } from 'react-icons/fi';
import { MoreVertical } from 'lucide-react';
import { AiOutlinePlus, AiOutlineSearch } from 'react-icons/ai';
import api from '@/app/lib/api';

import { useRouter, useParams } from 'next/navigation';
interface Conversation{
  title:string;
  id:string;
}
const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { connected, address } = useWallet();
  const { conversationId } = useParams();
  const [kebabMenu, setKebabMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    id: '',
  });



  async function getConvoIds() {
    try {
      let res = await api.get(`/conversations/user/${address}/id`);
      setConversations(res.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (address) {
      (async () => {
        await getConvoIds();
      })();
    }
  }, [connected, address]);

  const addChat = () => {
    if (!address) {
      alert('connect wallet to add a new chat ');
    } else {
      (async () => {
        try {
          const res = await api.post('/conversations/new', {
            walletAddress: address,
          });
          const { _id } = res.data;
          router.push(`/conversations/${_id}`);
        } catch (error) {
          alert('failed to create new chat');
        }
      })();
    }
  };

  const handleKebabClick = (event:React.MouseEvent, id:string) => {
    event.stopPropagation(); // Prevent navigation to the conversation
    setKebabMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      id: id,
    });
  };

  const handleKebabClose = () => {
    setKebabMenu({ ...kebabMenu, show: false });
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/conversations/${kebabMenu.id}/remove`);
    console.log(response)
      if (response.status === 204) {  
        setConversations(conversations.filter((convo) => convo.id !== kebabMenu.id));
        handleKebabClose();
  
        if (kebabMenu.id === conversationId) {
          router.push('/'); 
        }
      } else {
        console.error("Unexpected status code:", response.status);
        alert("Failed to delete conversation. Server returned an unexpected response.");
      }
  
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Failed to delete conversation. Please check your connection and try again."); // More user-friendly message
    }
  };


  const chats = () => {
    if (!connected)
      return (
        <p className="p-1 font-bold">
          You are on anonymous mode, please connect wallet to store messages
        </p>
      );
    return (
      <>
        {!conversations.length?"": conversations.map((conversation) => (
          <div
            key={conversation.id + conversation.title}
            onClick={() => router.push(`/conversations/${conversation.id}`)}
            className={`${
              conversation.id == conversationId ? 'bg-purple-600' : ''
            } p-2 border rounded-lg mt-1 flex justify-center items-center relative`} // Added relative here
          >
            <p
              className={`${
                conversation.id == conversationId ? 'text-white' : ''
              }`}
            >
              conversation {conversation.id}
            </p>
            <MoreVertical
              size={30}
              className="z-10 cursor-pointer" // Added cursor-pointer
              onClick={(e) => handleKebabClick(e, conversation.id)} // Pass the ID
            />

          </div>
        ))}
        {/* Kebab Menu */}
        {kebabMenu.show && (
          <div
            style={{ left: kebabMenu.x, top: kebabMenu.y }}
            className="absolute z-50 bg-white border rounded shadow-lg p-2"
          >
            <button className="block w-full text-left py-1 hover:bg-gray-100" onClick={() => {
              
              console.log("Rename clicked for", kebabMenu.id)
              handleKebabClose();
            }}>
              Rename
            </button>
            <button className="block w-full text-left py-1 hover:bg-gray-100" onClick={handleDelete}>
              Delete
            </button>
            <button className="block w-full text-left py-1 hover:bg-gray-100" onClick={handleKebabClose}>
              Cancel
            </button>
          </div>
        )}
      </>
    );
  };
  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden sm:flex flex-col bg-white border-r w-72 p-4 space-y-4">
        {/* Logo */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-purple-600"></div>
          <span className="text-lg font-semibold">AtomaSage</span>
        </div>
        {/* New Chat Button */}
        <button
          className="flex items-center bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg w-full gap-2 transition-colors"
          onClick={addChat}
        >
          <AiOutlinePlus size={20} />
          <span>New Chat</span>
        </button>
        {/* Search Bar */}
        <div className="relative">
          <AiOutlineSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-gray-100 p-2 pl-10 rounded-lg focus:outline-none border-none"
          />
        </div>
        <div className="overflow-scroll">{chats()}</div>
      </div>

      {/* Mobile Menu Button */}
      <div className="sm:hidden">
        <button
          id="menu-button"
          className="fixed top-4 left-4 z-50 p-2 bg-white text-gray-800 rounded shadow-lg"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <FiMenu size={24} />
        </button>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div id="mobile-menu" className="fixed inset-0 bg-white flex flex-col z-40 p-4">
            <button
              className="self-end p-2 text-gray-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ✖
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-purple-600"></div>
              <span className="text-lg font-semibold">AtomaSage</span>
            </div>

            {/* New Chat Button */}
            <button
              className="flex items-center bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg w-full gap-2 mb-4 transition-colors"
              onClick={addChat}
            >
              <AiOutlinePlus size={20} />
              <span>New Chat</span>
            </button>

            {/* Search Bar */}
            <div className="relative">
              <AiOutlineSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-gray-100 p-2 pl-10 rounded-lg focus:outline-none border-none"
              />
              {chats()}
            </div>
          </div>
        )}
      </div>
      {/* chat window */}
      {/* Main Content */}
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
};

export default Sidebar;
