import { Link, Tabs } from 'expo-router';
import { ThemeToggle } from '~/components/ThemeToggle';
import { Home } from '~/lib/icons/Home';
import { UserRoundCog } from '~/lib/icons/UserSetting';
import { ChartColumn } from '~/lib/icons/Stats';
import { BellIcon } from '~/lib/icons/Notifications';
import { Pressable, View } from 'react-native';
import { cn } from '~/lib/utils';
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // tabBarStyle: { borderTopRightRadius: 20, borderTopLeftRadius: 20 },
        tabBarShowLabel: false,
        tabBarActiveTintColor: 'hsl(22.93 92.59% 52.35%)',
        headerTransparent: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          headerRight: () => (
            <Link href={'/modal'} className="mr-4">
              <UserRoundCog className="text-foreground" size={23} strokeWidth={1.25} />
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <ChartColumn size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="three"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <BellIcon size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
