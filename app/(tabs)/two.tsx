import * as React from 'react';
import { View, ScrollView, Text } from 'react-native';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

import GrowthChart from '~/components/Chart';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import BarGroupPage from '~/components/Bar';
import { ChevronUp } from '~/lib/icons/ChevronUp';
import { ChevronDown } from '~/lib/icons/ChevronDown';
import { H1, H2, H3, H4, Muted } from '~/components/ui/typography';
import { Separator } from '~/components/ui/separator';

export default function Home() {
  const headerHeight = useHeaderHeight();
  return (
    <SafeAreaView className="flex-1">
      <ScrollView style={{ marginTop: headerHeight / 2 }} className="flex-1">
        <View className="flex-1 gap-8 p-6 pt-8">
          <Card className=" w-full flex-1 rounded-2xl   p-3">
            <CardContent className="flex-1 p-0">
              <View className="flex-1 flex-row items-center justify-between gap-4">
                <View className="flex-1 flex-row items-center justify-center gap-4">
                  <View className=" aspect-square h-12 w-12 items-center justify-center  rounded-full  bg-green-600">
                    <ChevronUp size={26} className="h-4 w-4 text-primary-foreground" />
                  </View>
                  <View className="flex-1 items-center justify-center">
                    <H2 className="pb-0">$5,440</H2>
                    <Muted className="text-xl">Income</Muted>
                  </View>
                </View>
                <Separator orientation="vertical" />
                <View className="flex-1 flex-row items-center justify-center gap-4">
                  <View className=" aspect-square h-12 w-12 items-center justify-center  rounded-full  bg-yellow-600">
                    <ChevronDown size={26} className="h-4 w-4 text-primary-foreground" />
                  </View>
                  <View className="flex-1 items-center justify-center">
                    <H2 className="pb-0">$2,440</H2>
                    <Muted className="text-xl">Expense</Muted>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card className="h-[300px] w-full flex-1 rounded-2xl   p-3">
            <CardHeader className="items-center">
              <CardTitle className="pb-2 text-center">Rick Sanchez</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <GrowthChart />
            </CardContent>
          </Card>

          <Card className="h-[300px] w-full flex-1 rounded-2xl   p-3">
            <CardHeader className="items-center">
              <CardTitle className="pb-2 text-center">Rick Sanchez</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <BarGroupPage />
            </CardContent>
          </Card>

          <H3 className="pb-1">Recent Expenses</H3>

          <View className="gap-6">
            {[1, 2, 3, 4].map((item, index) => (
              <React.Fragment key={index}>
                <View className="flex w-full flex-row items-center justify-between gap-6 ">
                  <View className="flex flex-row items-center justify-center gap-4 ">
                    <View>
                      <H4 className="pb-1">Walmart</H4>
                      <Muted className="">8:00 AM</Muted>
                    </View>
                  </View>
                  <Text className="text-primary-foreground">-{item}4,000</Text>
                </View>
                <Separator />
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
