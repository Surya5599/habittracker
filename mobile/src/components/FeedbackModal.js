import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import tw from 'twrnc';
import { Bug, MessageSquare, Send, X, ChevronLeft } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const KO_FI_URL = 'https://ko-fi.com/B0B31VLYXB';
const KO_FI_IMAGE = 'https://storage.ko-fi.com/cdn/kofi6.png?v=6';

export const FeedbackModal = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  isGuest,
  colorMode = 'light',
}) => {
  const [activeTab, setActiveTab] = useState('new');
  const [type, setType] = useState('bug');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const donationUrl = (process.env.EXPO_PUBLIC_DONATION_URL || KO_FI_URL).trim();
  const isDark = colorMode === 'dark';
  const outlineColor = isDark ? '#ffffff' : '#000000';

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [history]
  );

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('new');
    setSelectedThread(null);
    if (userId) {
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [isOpen, userId]);

  const fetchHistory = async () => {
    if (!userId) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          replies:feedback_replies(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map((item) => ({
        ...item,
        replies: (item.replies || []).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }));

      setHistory(normalized);
      return normalized;
    } catch (error) {
      console.error('Failed to load feedback history:', error);
      Alert.alert('Error', 'Failed to load your feedback history.');
      return [];
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Missing Message', 'Please enter your feedback.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: userId || null,
          type,
          content: content.trim(),
          status: 'open',
          metadata: {
            reporterName: userEmail ? userEmail.split('@')[0] : 'Guest',
            reporterEmail: userEmail || null,
            platform: 'mobile',
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;

      setContent('');
      Alert.alert('Submitted', 'Thanks for your feedback.');
      if (userId) {
        setActiveTab('history');
        fetchHistory();
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedThread || !replyContent.trim()) return;
    if (!userId || isGuest) {
      Alert.alert('Sign In Required', 'Please sign in to reply to feedback threads.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('feedback_replies')
        .insert({
          feedback_id: selectedThread.id,
          user_id: userId,
          content: replyContent.trim(),
          is_admin_reply: false
        });

      if (error) throw error;

      setReplyContent('');
      const refreshedHistory = await fetchHistory();
      const refreshed = refreshedHistory.find((item) => item.id === selectedThread.id);
      if (refreshed) setSelectedThread(refreshed);
    } catch (error) {
      console.error('Failed to send reply:', error);
      Alert.alert('Error', 'Failed to send reply.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={tw`flex-1 bg-black/60 justify-end`}>
        <View style={[tw`rounded-t-3xl h-[90%] overflow-hidden`, { backgroundColor: isDark ? '#000000' : '#f5f5f4' }]}>
          <View style={[tw`px-5 py-4 border-b flex-row items-center justify-between`, { backgroundColor: isDark ? '#0b0b0b' : '#ffffff', borderColor: isDark ? '#2a2a2a' : '#e7e5e4' }]}>
            <Text style={[tw`text-lg font-black uppercase tracking-widest`, { color: isDark ? '#e5e7eb' : '#44403c' }]}>Feedback</Text>
            <TouchableOpacity onPress={onClose} style={[tw`p-2 rounded-full`, { backgroundColor: isDark ? '#161616' : '#f5f5f4' }]}>
              <X size={18} color={isDark ? '#e5e7eb' : '#44403c'} />
            </TouchableOpacity>
          </View>

          {!selectedThread && (
            <View style={[tw`flex-row border-b`, { backgroundColor: isDark ? '#161616' : '#f5f5f4', borderColor: isDark ? '#2a2a2a' : '#e7e5e4' }]}>
              <TouchableOpacity
                onPress={() => setActiveTab('new')}
                style={tw.style(
                  `flex-1 py-3 items-center`,
                  activeTab === 'new' ? `bg-white border-b-2 border-black` : ``
                )}
              >
                <Text style={tw`text-[11px] font-black uppercase`}>New</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setActiveTab('history');
                  fetchHistory();
                }}
                style={tw.style(
                  `flex-1 py-3 items-center`,
                  activeTab === 'history' ? `bg-white border-b-2 border-black` : ``
                )}
              >
                <Text style={tw`text-[11px] font-black uppercase`}>History</Text>
              </TouchableOpacity>
            </View>
          )}

          {!selectedThread && activeTab === 'new' && (
            <ScrollView contentContainerStyle={tw`p-4 gap-4`}>
              {isGuest && (
                <View style={tw`p-3 bg-amber-50 border border-amber-300 rounded-xl`}>
                  <Text style={tw`text-xs text-amber-700 font-medium`}>
                    Guest mode: you can submit feedback, but replies are available after sign in.
                  </Text>
                </View>
              )}

              <View style={[tw`bg-white border-2 border-black rounded-2xl overflow-hidden`, { borderColor: outlineColor }]}>
                <View style={tw`flex-row`}>
                  <TouchableOpacity
                    onPress={() => setType('bug')}
                    style={[
                      tw.style(
                        `flex-1 flex-row items-center justify-center gap-2 py-3 border-r-2 border-black`,
                        type === 'bug' ? `bg-black` : `bg-white`
                      ),
                      { borderRightColor: outlineColor }
                    ]}
                  >
                    <Bug size={14} color={type === 'bug' ? '#fff' : '#44403c'} />
                    <Text style={tw.style(`text-xs font-black uppercase`, type === 'bug' ? `text-white` : `text-stone-700`)}>
                      Bug
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setType('suggestion')}
                    style={tw.style(
                      `flex-1 flex-row items-center justify-center gap-2 py-3`,
                      type === 'suggestion' ? `bg-black` : `bg-white`
                    )}
                  >
                    <MessageSquare size={14} color={type === 'suggestion' ? '#fff' : '#44403c'} />
                    <Text style={tw.style(`text-xs font-black uppercase`, type === 'suggestion' ? `text-white` : `text-stone-700`)}>
                      Suggestion
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[tw`bg-white border-2 border-black rounded-2xl p-3`, { borderColor: outlineColor }]}>
                <Text style={tw`text-[11px] font-black uppercase text-stone-500 mb-2`}>Your message</Text>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder={type === 'bug' ? 'Describe the issue...' : 'Share your idea...'}
                  multiline
                  textAlignVertical="top"
                  style={tw`min-h-[140px] text-sm text-stone-800`}
                />
              </View>

              <View style={tw`bg-rose-50 border border-rose-200 rounded-xl p-3`}>
                <Text style={tw`text-[10px] font-black uppercase tracking-widest text-rose-700 mb-2`}>Support development</Text>
                <TouchableOpacity
                  onPress={async () => {
                    const canOpen = await Linking.canOpenURL(donationUrl);
                    if (canOpen) {
                      await Linking.openURL(donationUrl);
                    } else {
                      Alert.alert('Unable to Open Link', donationUrl);
                    }
                  }}
                >
                  <Image
                    source={{ uri: KO_FI_IMAGE }}
                    style={{ width: 145, height: 36 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                disabled={submitting}
                onPress={handleSubmit}
                style={[tw.style(
                  `py-3 rounded-xl border-2 border-black flex-row items-center justify-center gap-2`,
                  submitting ? `bg-stone-400` : `bg-black`
                ), { borderColor: outlineColor }]}
              >
                <Text style={tw`text-sm font-black uppercase text-white`}>{submitting ? 'Submitting...' : 'Send Feedback'}</Text>
                <Send size={14} color="#fff" />
              </TouchableOpacity>
            </ScrollView>
          )}

          {!selectedThread && activeTab === 'history' && (
            <View style={tw`flex-1`}>
              {isGuest || !userId ? (
                <View style={tw`flex-1 items-center justify-center px-8`}>
                  <Text style={tw`text-stone-700 font-bold text-sm`}>Sign in to see feedback history.</Text>
                </View>
              ) : loadingHistory ? (
                <View style={tw`flex-1 items-center justify-center`}>
                  <ActivityIndicator color="#44403c" />
                </View>
              ) : sortedHistory.length === 0 ? (
                <View style={tw`flex-1 items-center justify-center`}>
                  <Text style={tw`text-stone-500 text-sm`}>No feedback yet.</Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={tw`p-3 gap-2`}>
                  {sortedHistory.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSelectedThread(item)}
                      style={tw`bg-white border border-stone-200 rounded-xl p-3`}
                    >
                      <View style={tw`flex-row items-center justify-between`}>
                        <Text style={tw`text-[10px] font-black uppercase text-stone-600`}>
                          {item.type}
                        </Text>
                        <Text style={tw`text-[10px] text-stone-400`}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={tw`text-sm text-stone-800 mt-1`} numberOfLines={2}>{item.content}</Text>
                      <Text style={tw`text-[10px] text-stone-500 mt-2`}>
                        Replies: {(item.replies || []).length}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {selectedThread && (
            <View style={tw`flex-1`}>
              <View style={tw`px-3 py-2 bg-white border-b border-stone-200 flex-row items-center gap-2`}>
                <TouchableOpacity onPress={() => setSelectedThread(null)} style={tw`p-1`}>
                  <ChevronLeft size={18} color="#44403c" />
                </TouchableOpacity>
                <Text style={tw`text-xs font-black uppercase tracking-wide text-stone-700`}>Thread</Text>
              </View>

              <ScrollView contentContainerStyle={tw`p-3 gap-3`}>
                <View style={tw`bg-white border border-stone-200 rounded-xl p-3`}>
                  <Text style={tw`text-[10px] font-black uppercase text-stone-500 mb-1`}>
                    Original ({selectedThread.type})
                  </Text>
                  <Text style={tw`text-sm text-stone-800`}>{selectedThread.content}</Text>
                </View>

                {(selectedThread.replies || []).map((reply) => (
                  <View
                    key={reply.id}
                    style={tw.style(
                      `p-3 rounded-xl border`,
                      reply.is_admin_reply ? `bg-stone-900 border-stone-900` : `bg-white border-stone-200`
                    )}
                  >
                    <Text style={tw.style(`text-[10px] font-black uppercase mb-1`, reply.is_admin_reply ? `text-white` : `text-stone-500`)}>
                      {reply.is_admin_reply ? 'HabiCard' : 'You'}
                    </Text>
                    <Text style={tw.style(`text-sm`, reply.is_admin_reply ? `text-white` : `text-stone-800`)}>
                      {reply.content}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <View style={tw`p-3 border-t border-stone-200 bg-white flex-row gap-2`}>
                <TextInput
                  value={replyContent}
                  onChangeText={setReplyContent}
                  placeholder="Write a reply..."
                  style={tw`flex-1 bg-stone-100 rounded-lg px-3 py-2 text-sm`}
                />
                <TouchableOpacity
                  onPress={handleReply}
                  disabled={!replyContent.trim() || submitting}
                  style={tw.style(
                    `px-4 rounded-lg items-center justify-center`,
                    !replyContent.trim() || submitting ? `bg-stone-300` : `bg-black`
                  )}
                >
                  <Send size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
