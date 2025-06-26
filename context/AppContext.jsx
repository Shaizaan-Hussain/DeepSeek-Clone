'use client';

import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = ({ children }) => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);

  const createNewChat = async () => {
    try {
      if (!user) return null;

      const token = await getToken();
      await axios.post(
        "/api/chat/create",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchUsersChats(); // ensure the newly created chat is fetched
    } catch (error) {
      toast.error(error.message || "Failed to create chat");
    }
  };

  const fetchUsersChats = async () => {
    try {
      setLoading(true);

      const token = await getToken();
      const { data } = await axios.get("/api/chat/get", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        const allChats = data.data || [];
        setChats(allChats);

        if (allChats.length === 0) {
          await createNewChat(); // create a default chat if none exists
          return;
        }

        // Sort by most recently updated
        allChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        // Fallback in case messages are missing
        const recentChat = {
          ...allChats[0],
          messages: allChats[0].messages || [],
        };

        setSelectedChat(recentChat);
        console.log("Selected Chat:", recentChat);
      } else {
        toast.error(data.message || "Failed to fetch chats");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsersChats();
    }
  }, [user]);

  const value = {
    user,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    fetchUsersChats,
    createNewChat,
    loading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
