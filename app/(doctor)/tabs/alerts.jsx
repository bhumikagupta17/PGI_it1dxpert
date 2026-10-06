import { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlertStore } from '../../../store/alertStore';
import { fromNow } from '../../../lib/utils';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../../constants/theme';

// Extended mock alerts (dashboard seeds the store, this screen shows them all)
const EXTRA_ALERTS = [
  { id: '5', patientName: 'Dev Patel',   message: 'Glucose steady at 112 mg/dL — within target', severity: 'info',     timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), acknowledged: true,  type: 'in_range'      },
  { id: '6', patientName: 'Neha Singh',  message: 'First reading of the day logged: 89 mg/dL',   severity: 'info',     timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), acknowledged: true,  type: 'first_reading' },
  { id: '7', patientName: 'Arun Kapoor', message: 'Post-meal spike detected: 195 mg/dL',          severity: 'warning',  timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), acknowledged: false, type: 'post_meal'     },
];

const SEV_CFG = {
  critical: { color: Colors.critical, icon: 'warning',            bg: '#FEF2F2' },
  warning:  { color: Colors.warning,  icon: 'alert-circle',       bg: '#FFFBEB' },
  info:     { color: Colors.info,     icon: 'information-circle',  bg: '#EFF6FF' },
};

const TYPE_LABEL = {
  high_glucose:   'High Glucose',
  low_glucose:    'Low Glucose',
  missed_reading: 'Missed Reading',
  missed_dose:    'Missed Dose',
  pattern:        'Pattern',
  in_range:       'In Range',
  first_reading:  'First Reading',
  post_meal:      'Post-Meal',
};

function AlertCard({ alert, onAck }) {
  const cfg = SEV_CFG[alert.severity] ?? SEV_CFG.info;
  return (
    <View style={[styles.card, Shadow.sm, { opacity: alert.acknowledged ? 0.72 : 1 }]}>
      <View style={[styles.severityStrip, { backgroundColor: cfg.color }]} />
      <View style={[styles.iconBox, { backgroundColor: cfg.color + '18' }]}>
        <Ionicons name={cfg.icon} size={22} color={cfg.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.topRow}>
          <Text style={styles.typeLabel}>
            {TYPE_LABEL[alert.type] ?? alert.severity.toUpperCase()}
          </Text>
          <Text style={styles.timeText}>{fromNow(alert.timestamp)}</Text>
        </View>
        <Text style={styles.patientName}>{alert.patientName}</Text>
        <Text style={styles.message}>{alert.message}</Text>

        {!alert.acknowledged ? (
          <TouchableOpacity
            style={[styles.ackBtn, { backgroundColor: cfg.color }]}
            onPress={() => onAck(alert.id)}
          >
            <Ionicons name="checkmark" size={14} color={Colors.white} />
            <Text style={styles.ackBtnText}>Acknowledge</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.ackdRow}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.inRange} />
            <Text style={styles.ackdText}>Acknowledged</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function AlertsScreen() {
  const { alerts: storeAlerts, acknowledge, unreadCount } = useAlertStore();
  const [filter, setFilter] = useState('all');
  const [localExtra, setLocalExtra] = useState(EXTRA_ALERTS);

  // Merge store alerts with extra mock alerts; deduplicate by id
  const allAlerts = [...storeAlerts];
  localExtra.forEach(e => {
    if (!allAlerts.find(a => a.id === e.id)) allAlerts.push(e);
  });

  const handleAck = (id) => {
    acknowledge(id);
    setLocalExtra(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const filtered = allAlerts
    .filter(a => {
      if (filter === 'unread')   return !a.acknowledged;
      if (filter === 'critical') return a.severity === 'critical';
      if (filter === 'warning')  return a.severity === 'warning';
      return true;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const unread    = allAlerts.filter(a => !a.acknowledged).length;
  const critical  = allAlerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;

  const FILTERS = [
    { key: 'all',      label: `All (${allAlerts.length})` },
    { key: 'unread',   label: `Unread (${unread})` },
    { key: 'critical', label: `Critical (${critical})` },
    { key: 'warning',  label: 'Warnings' },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>
            {unread > 0 ? `${unread} need attention` : 'All clear'}
          </Text>
        </View>
        <View style={[styles.badgeWrap, { backgroundColor: unread > 0 ? Colors.critical : Colors.inRange }]}>
          <Ionicons name={unread > 0 ? 'notifications' : 'notifications-outline'} size={18} color={Colors.white} />
          {unread > 0 && <Text style={styles.badgeNum}>{unread}</Text>}
        </View>
      </View>

      {/* Critical summary bar */}
      {critical > 0 && (
        <View style={styles.criticalBar}>
          <Ionicons name="warning" size={16} color={Colors.white} />
          <Text style={styles.criticalBarText}>
            {critical} critical alert{critical > 1 ? 's' : ''} require immediate action
          </Text>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <AlertCard alert={item} onAck={handleAck} />}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40, gap: Spacing.sm }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.inRange} />
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptyText}>No alerts match this filter</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: Colors.bg },

  header:           { backgroundColor: Colors.navy, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:            { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  subtitle:         { fontSize: FontSize.xs, color: Colors.tealLight, marginTop: 3 },
  badgeWrap:        { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  badgeNum:         { position: 'absolute', top: -2, right: -2, backgroundColor: Colors.white, borderRadius: 8, minWidth: 16, height: 16, textAlign: 'center', fontSize: 9, fontWeight: '800', color: Colors.critical, paddingHorizontal: 2 },

  criticalBar:      { backgroundColor: Colors.critical, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  criticalBarText:  { color: Colors.white, fontSize: FontSize.sm, fontWeight: '600', flex: 1 },

  filterRow:        { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  filterBtn:        { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  filterBtnActive:  { backgroundColor: Colors.navy, borderColor: Colors.navy },
  filterText:       { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: Colors.white },

  card:             { backgroundColor: Colors.white, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, overflow: 'hidden' },
  severityStrip:    { width: 4, alignSelf: 'stretch' },
  iconBox:          { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginVertical: Spacing.md, flexShrink: 0 },
  topRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: Spacing.md, paddingTop: Spacing.md },
  typeLabel:        { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  timeText:         { fontSize: FontSize.xs, color: Colors.textMuted },
  patientName:      { fontSize: FontSize.base, fontWeight: '700', color: Colors.textPrimary, marginTop: 2, paddingRight: Spacing.md },
  message:          { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 3, paddingRight: Spacing.md, lineHeight: 18 },

  ackBtn:           { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 5, marginTop: Spacing.sm, marginBottom: Spacing.md },
  ackBtnText:       { fontSize: FontSize.xs, fontWeight: '700', color: Colors.white },
  ackdRow:          { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm, marginBottom: Spacing.md },
  ackdText:         { fontSize: FontSize.xs, color: Colors.inRange, fontWeight: '600' },

  emptyState:       { alignItems: 'center', paddingTop: 60, gap: Spacing.sm },
  emptyTitle:       { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyText:        { fontSize: FontSize.base, color: Colors.textMuted },
});
