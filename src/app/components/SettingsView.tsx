import React, { memo, useState, useEffect } from 'react';
import {
  Clock,
  Eye,
  Download,
  Shield,
  Info,
  Key,
  Database,
  AlertCircle,
  ChevronRight,
  Lock,
  Activity,
  FileText,
  Cpu,
} from 'lucide-react';

interface SettingsViewProps {
  // Pass current settings from App.tsx to make this functional
  defaultTimeWindow?: '24h' | '7d' | '30d';
  defaultRiskThreshold?: number;
  onSettingsChange?: (settings: UserSettings) => void;
}

export interface UserSettings {
  defaultTimeWindow: '24h' | '7d' | '30d';
  nodeRenderingLimit: number;
  defaultRiskThreshold: number;
  autoIsolateHighRisk: boolean;
  patternVisibility: {
    circular: boolean;
    fanPattern: boolean;
    rapidPassThrough: boolean;
  };
  alertVerbosity: 'compact' | 'detailed';
  ringIsolationBehavior: 'highlight' | 'filter' | 'none';
  exportFormat: 'json' | 'pdf' | 'csv';
  includeGraphSnapshot: boolean;
  includeAlertsTimeline: boolean;
  anonymizeAccountIds: boolean;
  sessionTimeout: number;
  dataRetentionDays: number;
}

const defaultSettings: UserSettings = {
  defaultTimeWindow: '7d',
  nodeRenderingLimit: 1500,
  defaultRiskThreshold: 50,
  autoIsolateHighRisk: false,
  patternVisibility: {
    circular: true,
    fanPattern: true,
    rapidPassThrough: true,
  },
  alertVerbosity: 'detailed',
  ringIsolationBehavior: 'highlight',
  exportFormat: 'json',
  includeGraphSnapshot: true,
  includeAlertsTimeline: true,
  anonymizeAccountIds: false,
  sessionTimeout: 60,
  dataRetentionDays: 90,
};

const SettingSection = memo(function SettingSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#262626] rounded-xl p-6 mb-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
});

const SettingRow = memo(function SettingRow({
  label,
  description,
  children,
  isViewOnly,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  isViewOnly?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 dark:border-[#1f1f1f] last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-900 dark:text-white">{label}</label>
          {isViewOnly && (
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#171717] text-slate-500 dark:text-slate-400 text-xs rounded">
              View Only
            </span>
          )}
        </div>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
});

const Toggle = memo(function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-[#404040]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
});

export const SettingsView = memo(function SettingsView({ onSettingsChange }: SettingsViewProps) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('muleguard_settings');
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('muleguard_settings', JSON.stringify(settings));
      onSettingsChange?.(settings);
    }
  }, [settings, onSettingsChange]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateNestedSetting = <K extends keyof UserSettings>(
    parentKey: K,
    childKey: string,
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] as any),
        [childKey]: value,
      },
    }));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Configure analysis preferences, visibility controls, and export options. Settings do not alter detection
          algorithms or risk scoring.
        </p>
      </div>

      {/* Analysis Settings */}
      <SettingSection
        icon={<Activity className="w-5 h-5" />}
        title="Analysis Settings"
        description="Configure default analysis parameters for new scans."
      >
        <SettingRow
          label="Default Time Window"
          description="Initial time range filter applied to graph visualization."
        >
          <select
            value={settings.defaultTimeWindow}
            onChange={(e) => updateSetting('defaultTimeWindow', e.target.value as any)}
            className="px-3 py-1.5 bg-white dark:bg-[#171717] border border-slate-300 dark:border-[#404040] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </SettingRow>

        <SettingRow
          label="Node Rendering Limit"
          description="Maximum nodes displayed in graph (performance optimization)."
          isViewOnly
        >
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-lg text-sm text-slate-600 dark:text-slate-400">
            {settings.nodeRenderingLimit.toLocaleString()} nodes
          </div>
        </SettingRow>

        <SettingRow
          label="Default Risk Threshold"
          description="Initial suspicion score threshold for flagging entities (view-only, adjustable during analysis)."
          isViewOnly
        >
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-lg text-sm text-slate-600 dark:text-slate-400">
            {settings.defaultRiskThreshold}/100
          </div>
        </SettingRow>

        <SettingRow
          label="Auto-Isolate High-Risk Entities"
          description="Automatically highlight entities with suspicion score > 80 in graph view."
        >
          <Toggle
            enabled={settings.autoIsolateHighRisk}
            onChange={(val) => updateSetting('autoIsolateHighRisk', val)}
          />
        </SettingRow>
      </SettingSection>

      {/* Detection Visibility */}
      <SettingSection
        icon={<Eye className="w-5 h-5" />}
        title="Detection Visibility"
        description="Control which fraud patterns are visible by default (does not affect detection logic)."
      >
        <SettingRow
          label="Circular Transfers Pattern"
          description="Show entities involved in circular money flow loops."
        >
          <Toggle
            enabled={settings.patternVisibility.circular}
            onChange={(val) => updateNestedSetting('patternVisibility', 'circular', val)}
          />
        </SettingRow>

        <SettingRow
          label="Fan-In / Fan-Out Pattern"
          description="Show entities with high concentration or distribution of funds."
        >
          <Toggle
            enabled={settings.patternVisibility.fanPattern}
            onChange={(val) => updateNestedSetting('patternVisibility', 'fanPattern', val)}
          />
        </SettingRow>

        <SettingRow
          label="Rapid Pass-Through Pattern"
          description="Show shell accounts with fast fund turnover (low balance retention)."
        >
          <Toggle
            enabled={settings.patternVisibility.rapidPassThrough}
            onChange={(val) => updateNestedSetting('patternVisibility', 'rapidPassThrough', val)}
          />
        </SettingRow>

        <SettingRow
          label="Alert Verbosity"
          description="Level of detail shown in alerts panel."
        >
          <select
            value={settings.alertVerbosity}
            onChange={(e) => updateSetting('alertVerbosity', e.target.value as any)}
            className="px-3 py-1.5 bg-white dark:bg-[#171717] border border-slate-300 dark:border-[#404040] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="compact">Compact</option>
            <option value="detailed">Detailed</option>
          </select>
        </SettingRow>

        <SettingRow
          label="Ring Isolation Behavior"
          description="How fraud rings are displayed when selected."
        >
          <select
            value={settings.ringIsolationBehavior}
            onChange={(e) => updateSetting('ringIsolationBehavior', e.target.value as any)}
            className="px-3 py-1.5 bg-white dark:bg-[#171717] border border-slate-300 dark:border-[#404040] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="highlight">Highlight (preserve full graph)</option>
            <option value="filter">Filter (isolate ring only)</option>
            <option value="none">None (no special treatment)</option>
          </select>
        </SettingRow>
      </SettingSection>

      {/* Export & Evidence */}
      <SettingSection
        icon={<Download className="w-5 h-5" />}
        title="Export & Evidence"
        description="Configure default export format and included data components."
      >
        <SettingRow label="Default Export Format" description="Preferred format for evidence export.">
          <select
            value={settings.exportFormat}
            onChange={(e) => updateSetting('exportFormat', e.target.value as any)}
            className="px-3 py-1.5 bg-white dark:bg-[#171717] border border-slate-300 dark:border-[#404040] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="json">JSON (full data)</option>
            <option value="pdf">PDF (report format)</option>
            <option value="csv">CSV (tabular export)</option>
          </select>
        </SettingRow>

        <SettingRow
          label="Include Graph Snapshot"
          description="Embed visual graph image in PDF exports."
        >
          <Toggle
            enabled={settings.includeGraphSnapshot}
            onChange={(val) => updateSetting('includeGraphSnapshot', val)}
          />
        </SettingRow>

        <SettingRow
          label="Include Alerts Timeline"
          description="Add chronological alert list to exports."
        >
          <Toggle
            enabled={settings.includeAlertsTimeline}
            onChange={(val) => updateSetting('includeAlertsTimeline', val)}
          />
        </SettingRow>

        <SettingRow
          label="Anonymize Account IDs"
          description="Replace account identifiers with hashed values in exports (preserves graph structure)."
        >
          <Toggle
            enabled={settings.anonymizeAccountIds}
            onChange={(val) => updateSetting('anonymizeAccountIds', val)}
          />
        </SettingRow>
      </SettingSection>

      {/* Account & Security */}
      <SettingSection
        icon={<Shield className="w-5 h-5" />}
        title="Account & Security"
        description="Manage authentication, session, and data retention settings."
      >
        <SettingRow
          label="Change Password"
          description="Update your account password."
        >
          <button className="px-3 py-1.5 bg-slate-100 dark:bg-[#171717] hover:bg-slate-200 dark:hover:bg-[#262626] border border-slate-300 dark:border-[#404040] rounded-lg text-sm text-slate-900 dark:text-white transition-colors">
            Update
          </button>
        </SettingRow>

        <SettingRow
          label="Session Timeout"
          description="Auto-logout after period of inactivity (minutes)."
        >
          <select
            value={settings.sessionTimeout}
            onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
            className="px-3 py-1.5 bg-white dark:bg-[#171717] border border-slate-300 dark:border-[#404040] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="120">2 hours</option>
            <option value="0">Never</option>
          </select>
        </SettingRow>

        <SettingRow
          label="API Key"
          description="For programmatic access (Enterprise only)."
          isViewOnly
        >
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-lg text-sm text-slate-400 font-mono">
              ••••••••••••••••
            </div>
            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#171717] rounded text-slate-500 dark:text-slate-400 transition-colors">
              <Key className="w-4 h-4" />
            </button>
          </div>
        </SettingRow>

        <SettingRow
          label="Data Retention Period"
          description="How long scan history is preserved in local storage."
        >
          <select
            value={settings.dataRetentionDays}
            onChange={(e) => updateSetting('dataRetentionDays', parseInt(e.target.value))}
            className="px-3 py-1.5 bg-white dark:bg-[#171717] border border-slate-300 dark:border-[#404040] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="180">180 days</option>
            <option value="365">1 year</option>
          </select>
        </SettingRow>
      </SettingSection>

      {/* About & Transparency */}
      <SettingSection
        icon={<Info className="w-5 h-5" />}
        title="About & Transparency"
        description="Learn about MuleGuard's detection methodology and algorithms."
      >
        <div className="bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-lg p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Risk Scoring Methodology
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              MuleGuard uses a composite suspicion score combining three dimensions:
            </p>
            <ul className="text-xs text-slate-600 dark:text-slate-300 mt-2 space-y-1 ml-4">
              <li>• <strong>Structural (max 100)</strong>: Graph topology patterns (cycles, fan-in/out, shell behavior)</li>
              <li>• <strong>Behavioral (max 40)</strong>: Transaction timing, velocity, balance anomalies</li>
              <li>• <strong>Network (max 20)</strong>: Ring membership, peer suspicion propagation</li>
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Total suspicion score = min(structural + behavioral + network, 100)
            </p>
          </div>

          <div className="border-t border-slate-200 dark:border-[#262626] pt-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Detection Algorithms
            </h3>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 ml-4">
              <li>• <strong>Cycle Detection:</strong> Depth-first search for circular fund flows (3-10 hops)</li>
              <li>• <strong>Smurfing Detection:</strong> Fan-in clustering with amount/timing correlation</li>
              <li>• <strong>Shell Account Detection:</strong> High flow-through, low balance retention</li>
              <li>• <strong>PaySim Calibration:</strong> Balance anomaly detection, account draining, zero-balance destinations</li>
            </ul>
          </div>

          <div className="border-t border-slate-200 dark:border-[#262626] pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Version</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">MuleGuard v1.0.0 (PaySim-Calibrated Build)</p>
              </div>
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                Documentation
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-[#262626] pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Support</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Get help from our team</p>
              </div>
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                Contact Support
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </SettingSection>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
            Settings Do Not Affect Detection
          </h3>
          <p className="text-xs text-blue-800 dark:text-blue-300">
            All configuration changes are visibility and workflow preferences only. Detection algorithms, scoring
            formulas, and pattern thresholds remain unchanged. To modify detection sensitivity, contact your account
            manager for custom threshold calibration (Enterprise only).
          </p>
        </div>
      </div>
    </div>
  );
});
