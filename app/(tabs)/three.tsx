import { View } from 'react-native';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '~/components/ui/hover-card';
import { Text } from '~/components/ui/text';
import { CalendarDays } from '~/lib/icons/CalendarDays';

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center gap-12 p-6">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="link" size="lg">
            <Text>@shariandabre</Text>
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="native:w-96 w-80">
          <View className="flex flex-row justify-between gap-4">
            <Avatar alt="Vercel avatar">
              <AvatarImage source={{ uri: 'https://github.com/vercel.png' }} />
              <AvatarFallback>
                <Text>VA</Text>
              </AvatarFallback>
            </Avatar>
            <View className="flex-1 gap-1">
              <Text className="native:text-base text-sm font-semibold">@nextjs</Text>
              <Text className="native:text-base text-sm">
                The React Framework – created and maintained by @vercel.
              </Text>
              <View className="flex flex-row items-center gap-2 pt-2">
                <CalendarDays size={14} className="text-foreground opacity-70" />
                <Text className="native:text-sm text-muted-foreground text-xs">
                  Joined December 2021
                </Text>
              </View>
            </View>
          </View>
        </HoverCardContent>
      </HoverCard>
    </View>
  );
}
