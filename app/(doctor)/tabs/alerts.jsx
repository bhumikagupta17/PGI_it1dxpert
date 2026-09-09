import { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { alertsApi } from '../../../lib/api';
import { useAlertStore } from '../../../store/alertStore';
import { fromNow } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

const SEVERITY_ICON = {
  critical: { icon: 'warning',          color: Colors.critical },
  warning:  { icon: 'alert-circle',     color: Colors.warning  },
  info:     { icon: 'information-circle', color: Colors.info   },
};

const TYPE_LABEL = {
  high_glucose:   'High Glucose',
  low_glucose:    'Low Glucose',
  missed_reading: 'Missed Reading',
  missed_dose:    'Missed Dose',
  pattern:        'Pattern Detected',
  system:         'System',
};

function AlertCard({ alert, onAck }) {
  const sev = SEVERITY_ICON[alert.severity] ?? SEVERITY_ICON.info;
  return (
    <View style={[styles.card, { borderLeftColor: sev.color, borderLeftWidth: 4, opacity: alert.acknowledged ? 0.6 : 1 }]}>
      <View style={[styles.iconBox, { backgroundColor: sev.color + '18' }]}>
        <Ionicons name={sev.icon} size={22} color={sev.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.cardHeader}>
          <Text style={styles.typeLabel}>{TYPE_LABEL[alert.type] ?? alert.type}</Text>
          <Text style={styles.time}>{fromNow(alert.timestamp)}</Text>
        </View>
        <Text style={styles.patient}>{alert.patientName}</Text>
        <Text style={styles.message}>{alert.message}</Text>
        {alert.value != null && (
          <Text style={[styles.valueText, { color: sev.color }]}>Value: {alert.value} mg/dL</Text>
        )}
        {!alert.acknowledged && (
          <TouchableOpacity style={[styles.ackBtn, { borderColor: sev.color }]} onPress={() => onAck(alert.id)}>
            <Text style={[styles.ackText, { color: sev.color }]}>Acknowledge</Text>
          </TouchableOpacity>
        )}
        {alert.acknowledged && (
          <Text style={styles.ackdText}>✓ Acknowledged</Text>
        )}
      </View>
    </View>
  );
}

export default function AlertsScreen() {
  const { alerts, setAlerts, acknowledge, unreadCount } = useAlertStore();
  const [filter, setFilter] = useState('all'); // all | unread | critical

  const { isRefetching, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await alertsApi.getAll();
      setAlerts(data.data);
      return data.data;
    },
  });

  const handleAck = async (id) => {
    acknowledge(id);
    try { await alertsApi.acknowledge(id); } catch (_) {}
  };

  const filtered = alerts.filter(a => {
    if (filter === 'unread')   return !a.acknowledged;
    if (filter === 'critical') return a.severity === 'critical';
    return true;
  });

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alerts</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadBadge}>{unreadCount} unread</Text>
          )}
        </View>
        <Ionicons name="notifications" size={24} color={Colors.white} />
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {['all', 'unread', 'critical'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <AlertCard alert={item} onAck={handleAck} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.sm }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.inRange} />
            <Text style={styles.emptyText}>No alerts</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  header:         { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:          { fontSize: FontSize.xl, fontWeight: '700', color: Colors.white },
  unreadBadge:    { fontSize: FontSize.xs, color: Colors.amber, marginTop: 4, fontWeight: '700' },
  filterRow:      { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.sm },
  filterBtn:      { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  filterBtnActive:{ backgroundColor: Colors.navy, borderColor: Colors.navy },
  filterText:     { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive:{ color: Colors.white },
  card:           { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', gap: Spacing.md, ...Shadow.sm },
  iconBox:        { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  typeLabel:      { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  time:           { fontSize: FontSize.xs, color: Colors.textMuted },
  patient:        { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary },
  message:        { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 3 },
  valueText:      { fontSize: FontSize.sm, fontWeight: '700', marginTop: 4 },
  ackBtn:         { alignSelf: 'flex-start', borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 5, marginTop: Spacing.sm },
  ackText:        { fontSize: FontSize.sm, fontWeight: '700' },
  ackdText:       { fontSize: FontSize.xs, color: Colors.inRange, fontWeight: '600', marginTop: Spacing.xs },
  empty:          { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyText:      { fontSize: FontSize.md, color: Colors.textMuted },
});
