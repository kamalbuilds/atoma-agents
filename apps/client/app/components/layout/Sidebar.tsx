'use client';
import { useWallet } from '@suiet/wallet-kit';
import { useState, useEffect } from 'react';
import { FiMenu } from 'react-icons/fi';
import { AiOutlinePlus, AiOutlineSearch } from 'react-icons/ai';
import api from '@/app/lib/api';
import { useRouter, useParams } from 'next/navigation';
const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [conversations, setConversations] = useState([{ title: '', id: '' }]);
  const { connected, address } = useWallet();
  const { conversationId } = useParams();
  async function getConvoIds() {
    try {
      let res = await api.get(`/conversations/user/${address}/id`);
      setConversations(res.data);
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    console.log(connected, address);
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
            walletAddress: address
          });
          const { _id } = res.data;
          router.push(`/conversations/${_id}`);
          console.log(res);
        } catch (error) {
          alert('failed to create new chat');
        }
      })();
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
        {conversations.map((conversation) => {
          return (
            <div
              key={conversation.id + conversation.title}
              onClick={() => router.push(`/conversations/${conversation.id}`)}
              className={`${conversation.id == conversationId ? 'bg-purple-600' : ''} p-2 border rounded-lg mt-1`}
            >
              <p className={`${conversation.id == conversationId ? 'text-white' : ''}`}>
                conversation {conversation.id}
              </p>
            </div>
          );
        })}
      </>
    );
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        !(event.target as HTMLElement).closest('#mobile-menu') &&
        !(event.target as HTMLElement).closest('#menu-button')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden sm:flex flex-col bg-white border-r w-72 p-4 space-y-4">
        {/* Logo */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-purple-600"></div>
          <span className="text-lg font-semibold">Atoma Network</span>
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
              <span className="text-lg font-semibold">Atoma Network</span>
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
