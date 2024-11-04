import * as React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { H1, H2, H3, H4, Lead, Muted } from '~/components/ui/typography';
import { Button } from '~/components/ui/button';
import { ReceiptText } from '~/lib/icons/ReceiptText';
import { History } from '~/lib/icons/History';
import { ScanText } from '~/lib/icons/ScanText';
import { BookType } from '~/lib/icons/BookType';
import { Separator } from '~/components/ui/separator';
import { Badge } from '~/components/ui/badge';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import ReceiptBottomSheet from '~/components/ReceiptSheet';
import { router } from 'expo-router';

// Move interfaces and constants outside component
interface Receipt {
  id: string;
  shopName: string;
  totalAmount: number;
  date: string;
  imageUri: string;
}

const RECEIPTS_STORAGE_KEY = '@receipts';
const genAI = new GoogleGenerativeAI('AIzaSyCFnoLJvV1tbhuqjRmT2rV-y8QFMjcjsxQ');

// Move helper functions outside component
const extractJSONFromText = (text: string) => {
  try {
    try {
      return JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{(?:[^{}]|{[^{}]*})*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      const cleanJson = jsonMatch[0].replace(/```json|\```/g, '').trim();
      return JSON.parse(cleanJson);
    }
  } catch (error) {
    console.error('JSON extraction error:', error);
    throw new Error('Failed to parse receipt data');
  }
};

const processImage = async (uri: string) => {
  try {
    const manipResult = await manipulateAsync(uri, [{ resize: { width: 1024 } }], {
      compress: 0.7,
      format: SaveFormat.JPEG,
    });

    const fileInfo = await FileSystem.getInfoAsync(manipResult.uri);
    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return base64;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

const ReceiptList: React.FC<{
  receipts: Receipt[];
  onReceiptPress: (receipt: Receipt) => void;
}> = React.memo(({ receipts, onReceiptPress }) => {
  return (
    <View className="gap-6">
      {receipts.map((receipt, index) => (
        <React.Fragment key={receipt.id}>
          <TouchableOpacity onPress={() => onReceiptPress(receipt)}>
            <View className="flex w-full flex-row items-center justify-between gap-6">
              <View className="flex flex-row items-center justify-center gap-4">
                <Avatar alt="Receipt Avatar" className="aspect-square h-16 w-16 rounded-xl">
                  <AvatarFallback className="rounded-xl">
                    <Image
                      source={{ uri: receipt.imageUri }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  </AvatarFallback>
                </Avatar>
                <View style={{ maxWidth: 250 }}>
                  <H4 numberOfLines={1} ellipsizeMode="tail" className="pb-1">
                    {receipt.shopName}
                  </H4>
                  <Muted>{new Date(receipt.date).toLocaleDateString()}</Muted>
                </View>
              </View>
              <Badge>
                <Text className="text-primary-foreground">${receipt.totalAmount.toFixed(2)}</Text>
              </Badge>
            </View>
          </TouchableOpacity>
          {index < receipts.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </View>
  );
});

export default function Home() {
  // Group all hooks at the top
  const headerHeight = useHeaderHeight();
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const viewReceiptSheetRef = React.useRef<BottomSheet>(null);
  const snapPoints = React.useMemo(() => ['70%'], []);

  const [state, setState] = React.useState<AppState>({
    image: null,
    loading: false,
    error: null,
    hasPermission: null,
    imageModalVisible: false,
    receipts: [],
    selectedReceipt: null,
    result: null,
    showDeleteAlert: false,
  });

  const handleDeleteReceipt = React.useCallback(async () => {
    if (!state.selectedReceipt) return;

    try {
      const updatedReceipts = state.receipts.filter(
        (receipt) => receipt.id !== state.selectedReceipt?.id
      );
      await AsyncStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(updatedReceipts));

      updateState({
        receipts: updatedReceipts,
        selectedReceipt: null,
        showDeleteAlert: false,
      });
      viewReceiptSheetRef.current?.close();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      updateState({
        error: 'Failed to delete receipt',
        showDeleteAlert: false,
      });
    }
  }, [state.selectedReceipt, state.receipts, updateState]);

  // Update state helper
  const updateState = React.useCallback((newState: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  }, []);

  // Initialize
  React.useEffect(() => {
    const initialize = async () => {
      try {
        const savedReceipts = await AsyncStorage.getItem(RECEIPTS_STORAGE_KEY);
        if (savedReceipts) {
          updateState({ receipts: JSON.parse(savedReceipts) });
        }

        const { status } = await Camera.requestCameraPermissionsAsync();
        updateState({ hasPermission: status === 'granted' });
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initialize();
  }, [updateState]);

  // Handlers
  const handleImageCapture = React.useCallback(
    async (useCamera: boolean) => {
      try {
        const result = await (
          useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync
        )({
          quality: 0.7,
          allowsEditing: true,
          aspect: [4, 3],
        });

        if (!result.canceled) {
          updateState({
            image: result.assets[0].uri,
            loading: true,
          });
          await processReceipt(result.assets[0].uri);
        }
      } catch (error) {
        console.error('Error capturing image:', error);
        updateState({
          error: 'Error capturing image. Please try again.',
          loading: false,
        });
      }
    },
    [updateState]
  );

  const processReceipt = React.useCallback(
    async (imageUri: string) => {
      try {
        updateState({ error: null });
        const base64Data = await processImage(imageUri);
        const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro-latest' });

        const prompt = `
        Analyze this receipt image and extract ONLY the following information:
        1. Store/Shop name
        2. Total amount paid

        Return ONLY a JSON object with this exact format:
        {
          "shopName": "store name here",
          "totalAmount": numeric_amount_here
        }
      `;

        const result = await model.generateContent({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        });

        const response = await result.response;
        const responseText = response.text();
        const extractedData = extractJSONFromText(responseText);

        if (!extractedData || typeof extractedData !== 'object') {
          throw new Error('Invalid response format');
        }

        let totalAmount = extractedData.totalAmount;
        if (typeof totalAmount === 'string') {
          totalAmount = parseFloat(totalAmount.replace(/[^0-9.-]+/g, ''));
        }

        if (typeof totalAmount !== 'number' || isNaN(totalAmount)) {
          throw new Error('Invalid total amount');
        }

        updateState({
          result: {
            shopName: extractedData.shopName.trim(),
            totalAmount: totalAmount,
          },
        });

        bottomSheetRef.current?.expand();
      } catch (error) {
        console.error('Error processing receipt:', error);
        updateState({
          error:
            error instanceof Error ? error.message : 'Error processing receipt. Please try again.',
          result: null,
        });
      } finally {
        updateState({ loading: false });
      }
    },
    [updateState]
  );

  const handleSaveReceipt = React.useCallback(async () => {
    if (!state.result || !state.image) return;

    try {
      const newReceipt: Receipt = {
        id: Date.now().toString(),
        shopName: state.result.shopName,
        totalAmount: state.result.totalAmount,
        date: new Date().toISOString(),
        imageUri: state.image,
      };

      const updatedReceipts = [newReceipt, ...state.receipts];
      await AsyncStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(updatedReceipts));

      updateState({
        receipts: updatedReceipts,
        image: null,
        result: null,
      });

      bottomSheetRef.current?.close();
    } catch (error) {
      console.error('Error saving receipt:', error);
      updateState({ error: 'Failed to save receipt' });
    }
  }, [state.result, state.image, state.receipts, updateState]);

  const handleReceiptPress = React.useCallback(
    (receipt: Receipt) => {
      updateState({ selectedReceipt: receipt });
      viewReceiptSheetRef.current?.expand();
    },
    [updateState]
  );

  const handleBottomSheetChange = React.useCallback(
    (index: number) => {
      if (index === -1) {
        setTimeout(() => {
          updateState({ selectedReceipt: null });
        }, 100);
      }
    },
    [updateState]
  );

  // Early returns
  if (state.hasPermission === null) {
    return <View />;
  }

  if (state.hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  // Render recent receipts section

  return (
    <SafeAreaView className="flex-1">
      <View style={{ marginTop: headerHeight / 2 }} className="flex-1 gap-8 p-6 pt-8">
        {/* Header Section */}
        <View className="flex w-full flex-row items-center justify-between gap-6">
          <View>
            <H2 className="pb-1">Hi, Sharain</H2>
            <Muted className="text-xl">This month expense</Muted>
          </View>
          <H1>$15,020</H1>
        </View>

        <Card className="w-full rounded-2xl p-8">
          <CardContent className="flex items-center justify-center p-0">
            <View className="w-full flex-row justify-around gap-3">
              <TouchableOpacity onPress={() => handleImageCapture(true)} className="items-center">
                <ScanText size={26} className="mb-2 h-4 w-4 text-foreground" />
                <Muted className="">Scan</Muted>
              </TouchableOpacity>
              <Separator orientation="vertical" />
              <TouchableOpacity
                onPress={() => handleImageCapture(false)}
                className="items-center gap-2">
                <ReceiptText size={26} className="h-4 w-4 text-foreground" />
                <Muted className="">Upload</Muted>
              </TouchableOpacity>
              <Separator orientation="vertical" />
              <View className="items-center gap-2">
                <History size={26} className="h-4 w-4 text-foreground" />
                <Muted className="">History</Muted>
              </View>
              <Separator orientation="vertical" />
              <TouchableOpacity onPress={() => router.push('/ai')} className="items-center gap-2">
                <BookType size={26} className=" h-4 w-4 text-foreground" />
                <Muted className="">A.I. Info</Muted>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        <H3 className="pb-1">Recent Receipts</H3>
        <ReceiptList receipts={state.receipts} onReceiptPress={handleReceiptPress} />

        <AlertDialog open={state.loading}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Processing Receipt</AlertDialogTitle>
              <AlertDialogDescription>
                Please wait while we analyze your receipt...
              </AlertDialogDescription>
            </AlertDialogHeader>
            <View className="items-center justify-center p-4">
              <ActivityIndicator size="large" color="#0000ff" />
            </View>
          </AlertDialogContent>
        </AlertDialog>

        <BottomSheet
          ref={viewReceiptSheetRef}
          snapPoints={snapPoints}
          enablePanDownToClose
          index={-1}
          backgroundStyle={{ backgroundColor: '#1c1c1c' }}
          handleIndicatorStyle={{ backgroundColor: '#666' }}
          onChange={handleBottomSheetChange}>
          <BottomSheetView className="flex-1 p-6">
            <Card className="gap-6">
              <CardHeader className="">
                <H3 className="text-center text-white">Receipt Details</H3>
              </CardHeader>
              <CardContent className="gap-4">
                <View className="flex-row items-center justify-between border-b border-zinc-800 pb-4">
                  <Muted className="text-gray-400">Store</Muted>
                  <Lead className="text-start text-white ">{state.selectedReceipt?.shopName}</Lead>
                </View>

                <View className="flex-row items-center justify-between border-b border-zinc-800 pb-4">
                  <Muted className="text-gray-400">Date</Muted>
                  <Muted className="text-white">
                    {state.selectedReceipt?.date
                      ? new Date(state.selectedReceipt.date).toLocaleDateString()
                      : '-'}
                  </Muted>
                </View>

                <View className="flex-row items-center justify-between pt-2">
                  <H3 className="text-gray-400">Total Amount</H3>
                  <H3 className="text-white">
                    ${state.selectedReceipt?.totalAmount?.toFixed(2) || '0.00'}
                  </H3>
                </View>
              </CardContent>

              <CardFooter className="flex flex-col gap-2 pt-6">
                <Button
                  className="w-full items-center bg-primary"
                  onPress={() => updateState({ imageModalVisible: true })}>
                  <Text className="text-white">View Receipt Image</Text>
                </Button>
                <Button
                  className="w-full items-center bg-destructive"
                  onPress={() => updateState({ showDeleteAlert: true })}>
                  <Text className="text-white">Delete Receipt</Text>
                </Button>
              </CardFooter>
            </Card>
          </BottomSheetView>
        </BottomSheet>

        {/* Image Modal */}
        <Modal
          visible={state.imageModalVisible}
          transparent={true}
          onRequestClose={() => updateState({ imageModalVisible: false })}>
          <View className="flex-1 bg-black/90">
            <SafeAreaView className="flex-1">
              <View className="flex-1 p-4">
                <TouchableOpacity
                  className="absolute right-4 top-4 z-10"
                  onPress={() => updateState({ imageModalVisible: false })}>
                  <Text className="text-lg text-white">Close</Text>
                </TouchableOpacity>
                {state.selectedReceipt?.imageUri && (
                  <Image
                    source={{ uri: state.selectedReceipt.imageUri }}
                    className="flex-1"
                    resizeMode="contain"
                  />
                )}
              </View>
            </SafeAreaView>
          </View>
        </Modal>

        <AlertDialog open={state.showDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this receipt? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onPress={() => updateState({ showDeleteAlert: false })}
                className="bg-secondary">
                <Text className='text-primary-foreground' >Cancel</Text>
              </AlertDialogCancel>
              <AlertDialogAction onPress={handleDeleteReceipt} className="bg-destructive">
                <Text className='text-primary-foreground' >Delete</Text>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </View>
      <ReceiptBottomSheet
        bottomSheetRef={bottomSheetRef}
        snapPoints={snapPoints}
        result={state.result}
        onSave={handleSaveReceipt}
      />
    </SafeAreaView>
  );
}
