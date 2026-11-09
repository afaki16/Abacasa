// Tanım listeleri (Kategoriler, Kişiler) ve tanım silme akışı: ortak iskelet.

import { FlashList } from '@shopify/flash-list';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  SkeletonList,
  type IconName,
} from '@/components/ui';
import { makeStyles, Spacing, useColors } from '@/constants/theme';
import { type ApiError, flattenPages, type PagedResult } from '@/lib/api';
import { toast } from '@/stores/toastStore';

import { CardSegment, InUseDialog } from './DefinitionKit';

/**
 * Sayfalı tanım listesi tek kart görünümünde: yükleniyor iskeleti, boş durum (izin varsa "ekle" eylemi),
 * hata + tekrar dene, aşağı çekip yenile, sonsuz kaydırma.
 */
export function DefinitionList<T extends { id: number }>({
  query,
  renderRow,
  emptyIcon,
  emptyTitle,
  emptyMessage,
  addLabel,
  onAdd,
}: {
  query: UseInfiniteQueryResult<InfiniteData<PagedResult<T>>, ApiError>;
  renderRow: (item: T) => ReactElement;
  emptyIcon: IconName;
  emptyTitle: string;
  emptyMessage?: string;
  /** İzin yoksa verilmez. */
  addLabel?: string;
  onAdd?: () => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const items = flattenPages(query.data?.pages);

  if (query.isPending) {
    return (
      <View style={styles.list}>
        <SkeletonList rows={5} />
      </View>
    );
  }
  if (query.isError && items.length === 0) {
    return (
      <ErrorState
        title={t('common.error')}
        message={query.error.message}
        actionLabel={t('common.retry')}
        onAction={() => void query.refetch()}
      />
    );
  }
  return (
    <FlashList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
      }}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.background}
          onRefresh={() => void query.refetch()}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          message={emptyMessage}
          actionLabel={addLabel}
          actionIcon="add"
          onAction={onAdd}
        />
      }
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <ActivityIndicator style={styles.footer} color={colors.primary} />
        ) : null
      }
      renderItem={({ item, index }) => (
        <CardSegment first={index === 0} last={index === items.length - 1}>
          {renderRow(item)}
        </CardSegment>
      )}
    />
  );
}

/**
 * Tanım silme düğmesi: onay penceresi → sil; kullanımdaysa (409) backend'in mesajıyla "silinemez" penceresi
 * (isteğe bağlı ikincil eylem, ör. pasif yap). Diğer hatalar toast.
 */
export function DefinitionDeleteButton({
  label,
  confirmTitle,
  confirmMessage,
  inUseTitle,
  pending,
  onDelete,
  onDeleted,
  secondaryLabel,
  onSecondary,
  secondaryLoading,
}: {
  label: string;
  confirmTitle: string;
  confirmMessage?: string;
  inUseTitle: string;
  pending: boolean;
  onDelete: (handlers: { onSuccess: () => void; onError: (error: ApiError) => void }) => void;
  onDeleted: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryLoading?: boolean;
}) {
  const { t } = useTranslation();
  const [confirm, setConfirm] = useState(false);
  const [inUse, setInUse] = useState<string | null>(null);

  return (
    <>
      <Button title={label} variant="danger" onPress={() => setConfirm(true)} />
      <ConfirmDialog
        visible={confirm}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={t('common.delete')}
        destructive
        loading={pending}
        onCancel={() => setConfirm(false)}
        onConfirm={() =>
          onDelete({
            onSuccess: () => {
              setConfirm(false);
              onDeleted();
            },
            onError: (error) => {
              setConfirm(false);
              if (error.status === 409) setInUse(error.message);
              else toast.error(error.message);
            },
          })
        }
      />
      <InUseDialog
        visible={inUse !== null}
        title={inUseTitle}
        message={inUse ?? undefined}
        onClose={() => setInUse(null)}
        secondaryLabel={secondaryLabel}
        onSecondary={
          onSecondary
            ? () => {
                setInUse(null);
                onSecondary();
              }
            : undefined
        }
        secondaryLoading={secondaryLoading}
      />
    </>
  );
}

const useStyles = makeStyles(() => ({
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.xxl },
  footer: { marginVertical: Spacing.lg },
}));
