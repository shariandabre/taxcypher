import * as React from 'react';
import { View, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { GiftedChat, IMessage, Bubble, Send, InputToolbar } from 'react-native-gifted-chat';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { StatusBar } from 'expo-status-bar';

const BORDER_RADIUS = 8;

const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#111111' : '#F9F9F9',
  foreground: isDark ? '#EEEEEE' : '#201F1F',
  muted: isDark ? '#222222' : '#F0F0F0',
  mutedForeground: isDark ? '#B4B4B4' : '#666666',
  border: isDark ? '#1C1917' : '#D8D8D8',
  input: isDark ? '#484848' : '#F0F0F0',
  primary: '#FF6B35', // Keep primary color consistent
  primaryForeground: '#FFFFFF',
});

const genAI = new GoogleGenerativeAI('AIzaSyCFnoLJvV1tbhuqjRmT2rV-y8QFMjcjsxQ');

const SYSTEM_PROMPT = `You are a knowledgeable financial advisor chatbot. Only answer questions related to:
- Personal finance
- Money management
- Taxes
- Investments
- Budgeting
- Financial planning
- Banking
- Credit and loans

If a question is not related to finance or money, politely respond that you can only assist with financial and tax-related questions.

Keep responses clear, concise, and focused on practical advice. When discussing investments or financial strategies, include appropriate disclaimers about financial risks and the importance of consulting with qualified professionals.`;

export default function AI() {
  const { isDarkColorScheme } = useColorScheme();
  const isDark = isDarkColorScheme;
  const colors = getThemeColors(isDark);
  const headerHeight = useHeaderHeight();
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);

  React.useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: "Hello! I'm your financial AI assistant. I can help you with questions about money management, taxes, investments, and other financial topics. What would you like to know?",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Financial AI',
          avatar: 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=AI',
        },
      },
    ]);
  }, []);

  const generateFinancialResponse = async (userMessage: string) => {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `${SYSTEM_PROMPT}\n\nUser Question: ${userMessage}\n\nResponse:`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating response:', error);
      return "I apologize, but I'm having trouble processing your request. Please try again or rephrase your question.";
    }
  };

  const onSend = React.useCallback(async (newMessages: IMessage[] = []) => {
    setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
    setIsTyping(true);

    try {
      const userMessage = newMessages[0].text;
      const aiResponse = await generateFinancialResponse(userMessage);

      const aiMessage: IMessage = {
        _id: Date.now(),
        text: aiResponse,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Financial AI',
          avatar: 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=AI',
        },
      };

      setMessages((previousMessages) => GiftedChat.append(previousMessages, [aiMessage]));
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage: IMessage = {
        _id: Date.now(),
        text: 'I apologize, but I encountered an error. Please try again.',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Financial AI',
          avatar: 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=AI',
        },
      };
      setMessages((previousMessages) => GiftedChat.append(previousMessages, [errorMessage]));
    } finally {
      setIsTyping(false);
    }
  }, []);

  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: colors.muted,
            borderRadius: BORDER_RADIUS,
          },
          right: {
            backgroundColor: colors.primary,
            borderRadius: BORDER_RADIUS,
          },
        }}
        textStyle={{
          left: {
            color: colors.foreground,
          },
          right: {
            color: colors.primaryForeground,
          },
        }}
      />
    );
  };

  const CustomSendButton = ({ text, onPress }: { text: string; onPress: () => void }) => {
    if (!text) return null;

    return (
      <TouchableOpacity
        onPress={onPress}
        className="mb-1 mr-1 flex h-10 min-w-[60px] items-center justify-center rounded-lg bg-primary px-2">
        <Text className="font-bold text-primary-foreground">Send</Text>
      </TouchableOpacity>
    );
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          padding: 4,
        }}
        primaryStyle={{
          alignItems: 'center',
        }}
      />
    );
  };
  const renderSend = (props: any) => {
    return (
      <Send
        {...props}
        containerStyle={{
          backgroundColor: colors.primary,
          borderRadius: BORDER_RADIUS,
          padding: 4,
          marginRight: 4,
          marginBottom: 4,
        }}
        textStyle={{
          color: colors.primaryForeground,
          fontWeight: 'bold',
        }}
      />
    );
  };

  const renderLoading = () => {
    return (
      <View className="items-center justify-center p-3">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style={isDarkColorScheme ? 'light' : 'dark'} />
      <View
        style={{
          marginTop: headerHeight / 2,
          flex: 1,
        }}
        className="bg-background">
        <GiftedChat
          isStatusBarTranslucentAndroid={true}
          messages={messages}
          onSend={onSend}
          user={{
            _id: 1,
          }}
          isTyping={isTyping}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderSend={renderSend}
          renderLoading={renderLoading}
          renderAvatar={null}
          placeholder="Ask me about finance or taxes..."
          timeTextStyle={{
            right: { color: colors.mutedForeground },
            left: { color: colors.mutedForeground },
          }}
          textInputStyle={{
            backgroundColor: colors.input,
            borderRadius: BORDER_RADIUS,
            borderColor: colors.border,
            borderWidth: 1,
            color: colors.foreground,
            padding: 12,
            marginLeft: 4,
            marginRight: 4,
            marginBottom: 4,
          }}
          minInputToolbarHeight={60}
          maxComposerHeight={100}
        />
      </View>
    </SafeAreaView>
  );
}
