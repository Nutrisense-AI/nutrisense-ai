import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/api/supabase';
import { useAuthStore, useFridgeStore } from '@/context/store';
import { FridgeInventoryItem, InventoryStatus } from '@/types/database';
import {
  COLORS,
  EXPIRY_STATUS_COLORS,
  EXPIRY_STATUS_LABELS,
} from '@/constants';

const CATEGORY_ICONS: Record<string, string> = {
  dairy: '🥛',
  meat_raw: '🥩',
  meat_cooked: '🍖',
  poultry_raw: '🐔',
  seafood_raw: '🐟',
  vegetables_leafy: '🥬',
  vegetables_root: '🥕',
  fruits_berries: '🍓',
  fruits_citrus: '🍊',
  fruits_tropical: '🥭',
  bread: '🍞',
  eggs: '🥚',
  condiments: '🫙',
  leftovers: '🍱',
  frozen: '🧊',
  canned: '🥫',
  dry_goods: '🌾',
  beverages: '🧃',
  herbs_fresh: '🌿',
  other: '📦',
};

function FridgeChip({
  item,
  onDismiss,
  onPress,
}: {
  item: FridgeInventoryItem;
  onDismiss: (id: string) => void;
  onPress: (item: FridgeInventoryItem) => void;
}) {
  const statusColor = EXPIRY_STATUS_COLORS[item.expiry_status] ?? COLORS.text.muted;
  const icon = CATEGORY_ICONS[item.category] ?? '📦';

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background.elevated,
        borderRadius: 24,
        paddingVertical: 8,
        paddingLeft: 10,
        paddingRight: 6,
        borderWidth: 1,
        borderColor: `${statusColor}55`,
        gap: 6,
        margin: 4,
      }}
    >
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <View style={{ maxWidth: 100 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: COLORS.text.primary,
          }}
          numberOfLines={1}
        >
          {item.item_name}
        </Text>
        <Text style={{ fontSize: 10, color: statusColor, fontWeight: '500' }}>
          {EXPIRY_STATUS_LABELS[item.expiry_status]}
        </Text>
      </View>

      {/* Quantity badge */}
      {item.quantity > 1 && (
        <View
          style={{
            backgroundColor: COLORS.background.tertiary,
            borderRadius: 10,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <Text style={{ fontSize: 11, color: COLORS.text.muted, fontWeight: '600' }}>
            ×{item.quantity}
          </Text>
        </View>
      )}

      {/* Dismiss button */}
      <TouchableOpacity
        onPress={() => onDismiss(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: COLORS.background.tertiary,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: 2,
        }}
      >
        <Text style={{ fontSize: 10, color: COLORS.text.muted }}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function FridgeScreen() {
  const { user } = useAuthStore();
  const { items, isLoading, setItems, removeItem, setLoading } = useFridgeStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<InventoryStatus | 'all'>('all');

  const fetchInventory = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('fridge_inventory')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .eq('is_consumed', false)
      .order('expiry_status', { ascending: true })
      .order('expiration_date', { ascending: true, nullsFirst: false });

    if (data) setItems(data);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  };

  const handleDismiss = (id: string) => {
    Alert.alert(
      'Mark as Used',
      'Mark this item as consumed and remove it from your fridge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Used',
          onPress: async () => {
            await supabase
              .from('fridge_inventory')
              .update({ is_consumed: true } as any)
              .eq('id', id);
            removeItem(id);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase
              .from('fridge_inventory')
              .update({ is_deleted: true } as any)
              .eq('id', id);
            removeItem(id);
          },
        },
      ]
    );
  };

  const handleItemPress = (item: FridgeInventoryItem) => {
    Alert.alert(
      item.item_name,
      `Category: ${item.category}\nQuantity: ${item.quantity} ${item.unit}\nStatus: ${EXPIRY_STATUS_LABELS[item.expiry_status]}${item.expiration_date ? `\nExpires: ${new Date(item.expiration_date).toLocaleDateString()}` : ''}${item.calories_per_100g ? `\n\nPer 100g:\n• Calories: ${item.calories_per_100g} kcal\n• Protein: ${item.protein_per_100g ?? 0}g\n• Carbs: ${item.carbs_per_100g ?? 0}g\n• Fat: ${item.fat_per_100g ?? 0}g` : ''}`,
      [{ text: 'OK' }]
    );
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' || item.expiry_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Group by expiry status
  const expiredItems = filteredItems.filter((i) => i.expiry_status === 'expired');
  const expiringSoonItems = filteredItems.filter(
    (i) => i.expiry_status === 'expiring_today' || i.expiry_status === 'use_soon'
  );
  const freshItems = filteredItems.filter((i) => i.expiry_status === 'fresh');
  const unknownItems = filteredItems.filter((i) => i.expiry_status === 'unknown');

  const statusFilters: Array<{ key: InventoryStatus | 'all'; label: string; color: string }> = [
    { key: 'all', label: 'All', color: COLORS.primary.DEFAULT },
    { key: 'expired', label: 'Expired', color: EXPIRY_STATUS_COLORS.expired },
    { key: 'expiring_today', label: 'Today', color: EXPIRY_STATUS_COLORS.expiring_today },
    { key: 'use_soon', label: 'Soon', color: EXPIRY_STATUS_COLORS.use_soon },
    { key: 'fresh', label: 'Fresh', color: EXPIRY_STATUS_COLORS.fresh },
  ];

  const renderChipGroup = (
    groupItems: FridgeInventoryItem[],
    title: string,
    color: string
  ) => {
    if (groupItems.length === 0) return null;
    return (
      <View style={{ marginBottom: 20 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
            }}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: COLORS.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            {title}
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.text.muted }}>
            ({groupItems.length})
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -4 }}>
          {groupItems.map((item) => (
            <FridgeChip
              key={item.id}
              item={item}
              onDismiss={handleDismiss}
              onPress={handleItemPress}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.DEFAULT }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: '700', color: COLORS.text.primary }}>
              🧊 Smart Fridge
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.text.muted, marginTop: 2 }}>
              {items.length} item{items.length !== 1 ? 's' : ''} tracked
            </Text>
          </View>

          {/* Scan fridge button */}
          <TouchableOpacity
            onPress={() => router.push('/camera')}
            style={{ borderRadius: 14, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 14 }}>📷</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                Scan
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: COLORS.background.elevated,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: COLORS.border.DEFAULT,
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search ingredients..."
            placeholderTextColor={COLORS.text.muted}
            style={{ flex: 1, color: COLORS.text.primary, fontSize: 15 }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: COLORS.text.muted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setFilterStatus(filter.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor:
                  filterStatus === filter.key
                    ? `${filter.color}33`
                    : COLORS.background.elevated,
                borderWidth: 1,
                borderColor:
                  filterStatus === filter.key ? filter.color : COLORS.border.DEFAULT,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color:
                    filterStatus === filter.key ? filter.color : COLORS.text.muted,
                }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary.DEFAULT}
          />
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {isLoading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.primary.DEFAULT} size="large" />
          </View>
        ) : filteredItems.length === 0 ? (
          <View
            style={{
              paddingVertical: 60,
              alignItems: 'center',
              backgroundColor: COLORS.background.card,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: COLORS.border.DEFAULT,
              borderStyle: 'dashed',
              marginTop: 16,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🧊</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text.primary, marginBottom: 8 }}>
              {searchQuery ? 'No items found' : 'Fridge is empty'}
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.text.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 }}>
              {searchQuery
                ? 'Try a different search term'
                : 'Scan your fridge or pantry with the camera to automatically populate your inventory.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                onPress={() => router.push('/camera')}
                style={{ marginTop: 20, borderRadius: 12, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
                  style={{ paddingHorizontal: 24, paddingVertical: 12 }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                    📷 Scan Fridge
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {renderChipGroup(expiredItems, 'Expired', EXPIRY_STATUS_COLORS.expired)}
            {renderChipGroup(expiringSoonItems, 'Expiring Soon', EXPIRY_STATUS_COLORS.use_soon)}
            {renderChipGroup(freshItems, 'Fresh', EXPIRY_STATUS_COLORS.fresh)}
            {renderChipGroup(unknownItems, 'Unknown Expiry', EXPIRY_STATUS_COLORS.unknown)}
          </>
        )}

        {/* Generate Recipes CTA */}
        {items.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/log')}
            style={{ marginTop: 16, borderRadius: 16, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={[COLORS.accent.green, '#00A882']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 28 }}>🍳</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  Generate Zero-Waste Recipes
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>
                  AI creates 3 recipes from your current inventory
                </Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 18 }}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
