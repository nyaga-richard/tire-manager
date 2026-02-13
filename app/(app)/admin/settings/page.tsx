// app/(app)/admin/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Settings,
  Building,
  Users,
  Shield,
  Key,
  Mail,
  Bell,
  Database,
  Clock,
  DollarSign,
  Percent,
  Truck,
  Package,
  FileText,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Server,
  HardDrive,
  Activity,
  Download,
  Upload,
  RotateCcw,
  Home,
  User,
  UserCog,
  Calendar,
  CreditCard,
  Receipt,
  Calculator,
  Wrench,
  Loader2,
  Link,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "date-fns";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Interfaces
interface SystemSettings {
  id: number;
  company_name: string;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_website: string | null;
  company_tax_id: string | null;
  company_logo: string | null;
  fiscal_year_start: string;
  fiscal_year_end: string;
  date_format: string;
  time_format: string;
  timezone: string;
  currency: string;
  currency_symbol: string;
  vat_rate: number;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

interface EmailSettings {
  id: number;
  smtp_host: string;
  smtp_port: number;
  smtp_encryption: "tls" | "ssl" | "none";
  smtp_username: string | null;
  smtp_password: string | null;
  from_email: string;
  from_name: string;
  reply_to: string | null;
  enabled: number;
  created_at: string;
  updated_at: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  system_notifications: boolean;
  purchase_order_alerts: boolean;
  low_stock_alerts: boolean;
  retread_due_alerts: boolean;
  vehicle_service_alerts: boolean;
  user_login_alerts: boolean;
  daily_summary: boolean;
  weekly_report: boolean;
}

interface BackupSettings {
  enabled: number;
  frequency: "daily" | "weekly" | "monthly";
  retention_days: number;
  backup_time: string;
  include_attachments: number;
  last_backup: string | null;
  last_backup_size: number | null;
  last_backup_status: string | null;
}

interface AuditLogSettings {
  retention_days: number;
  log_failed_logins: boolean;
  log_successful_logins: boolean;
  log_api_calls: boolean;
  log_data_changes: boolean;
  log_exports: boolean;
}

interface TaxRate {
  id: number;
  name: string;
  rate: number;
  type: "VAT" | "SERVICE" | "OTHER";
  is_default: number;
  is_active: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface PaymentTerm {
  id: number;
  name: string;
  days: number;
  is_default: number;
  is_active: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isLoading: authLoading, hasPermission, authFetch } = useAuth();
  
  const [loading, setLoading] = useState({
    system: true,
    email: false,
    notifications: false,
    backup: false,
    audit: false,
    taxes: false,
    terms: false,
    saving: false
  });
  
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  
  // Settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    system_notifications: true,
    purchase_order_alerts: true,
    low_stock_alerts: true,
    retread_due_alerts: true,
    vehicle_service_alerts: true,
    user_login_alerts: false,
    daily_summary: false,
    weekly_report: true,
  });
  const [backupSettings, setBackupSettings] = useState<BackupSettings | null>(null);
  const [auditSettings, setAuditSettings] = useState<AuditLogSettings | null>(null);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  
  // Form states
  const [systemForm, setSystemForm] = useState({
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_website: "",
    company_tax_id: "",
    fiscal_year_start: "",
    fiscal_year_end: "",
    date_format: "MMM dd, yyyy",
    time_format: "HH:mm:ss",
    timezone: "Africa/Nairobi",
    currency: "KES",
    currency_symbol: "KSH",
    vat_rate: 16,
  });
  
  const [emailForm, setEmailForm] = useState({
    smtp_host: "",
    smtp_port: 587,
    smtp_encryption: "tls" as "tls" | "ssl" | "none",
    smtp_username: "",
    smtp_password: "",
    from_email: "",
    from_name: "",
    reply_to: "",
    enabled: true,
  });
  
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  
  const [backupForm, setBackupForm] = useState({
    enabled: true,
    frequency: "daily" as "daily" | "weekly" | "monthly",
    retention_days: 30,
    backup_time: "02:00",
    include_attachments: true,
  });
  
  const [auditForm, setAuditForm] = useState({
    retention_days: 90,
    log_failed_logins: true,
    log_successful_logins: false,
    log_api_calls: false,
    log_data_changes: true,
    log_exports: true,
  });
  
  // Dialog states
  const [isTaxDialogOpen, setIsTaxDialogOpen] = useState(false);
  const [isTermDialogOpen, setIsTermDialogOpen] = useState(false);
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxRate | null>(null);
  const [editingTerm, setEditingTerm] = useState<PaymentTerm | null>(null);
  const [taxForm, setTaxForm] = useState({
    name: "",
    rate: 16,
    type: "VAT" as "VAT" | "SERVICE" | "OTHER",
    is_default: false,
    is_active: true,
    description: "",
  });
  
  const [termForm, setTermForm] = useState({
    name: "",
    days: 30,
    is_default: false,
    is_active: true,
    description: "",
  });

  // Check authentication and permissions
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllSettings();
    }
  }, [isAuthenticated]);

  const fetchAllSettings = async () => {
    try {
      setLoading(prev => ({ ...prev, system: true }));
      setError(null);
      
      // Fetch all settings in parallel
      await Promise.all([
        fetchSystemSettings(),
        fetchEmailSettings(),
        fetchNotificationSettings(),
        fetchBackupSettings(),
        fetchAuditSettings(),
        fetchTaxRates(),
        fetchPaymentTerms(),
      ]);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      setError(error.message || "Failed to load settings");
      toast.error("Failed to load settings", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, system: false }));
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/settings/system`);
      const data = await response.json();
      
      if (data.success) {
        setSystemSettings(data.settings);
        setSystemForm({
          company_name: data.settings.company_name || "",
          company_address: data.settings.company_address || "",
          company_phone: data.settings.company_phone || "",
          company_email: data.settings.company_email || "",
          company_website: data.settings.company_website || "",
          company_tax_id: data.settings.company_tax_id || "",
          fiscal_year_start: data.settings.fiscal_year_start || "",
          fiscal_year_end: data.settings.fiscal_year_end || "",
          date_format: data.settings.date_format || "MMM dd, yyyy",
          time_format: data.settings.time_format || "HH:mm:ss",
          timezone: data.settings.timezone || "Africa/Nairobi",
          currency: data.settings.currency || "KES",
          currency_symbol: data.settings.currency_symbol || "KSH",
          vat_rate: data.settings.vat_rate || 16,
        });
      }
    } catch (error: any) {
      console.error("Error fetching system settings:", error);
      toast.error("Failed to load system settings", {
        description: error.message
      });
    }
  };

  const fetchEmailSettings = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/settings/email`);
      const data = await response.json();
      
      if (data.success) {
        setEmailSettings(data.settings);
        setEmailForm({
          smtp_host: data.settings.smtp_host || "",
          smtp_port: data.settings.smtp_port || 587,
          smtp_encryption: data.settings.smtp_encryption || "tls",
          smtp_username: data.settings.smtp_username || "",
          smtp_password: "", // Don't populate password from server
          from_email: data.settings.from_email || "",
          from_name: data.settings.from_name || "",
          reply_to: data.settings.reply_to || "",
          enabled: data.settings.enabled === 1,
        });
      }
    } catch (error: any) {
      console.error("Error fetching email settings:", error);
      toast.error("Failed to load email settings", {
        description: error.message
      });
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/settings/notifications`);
      const data = await response.json();
      
      if (data.success) {
        setNotificationSettings(data.settings);
      }
    } catch (error: any) {
      console.error("Error fetching notification settings:", error);
    }
  };

  const fetchBackupSettings = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/settings/backup`);
      const data = await response.json();
      
      if (data.success) {
        setBackupSettings(data.settings);
        setBackupForm({
          enabled: data.settings.enabled === 1,
          frequency: data.settings.frequency || "daily",
          retention_days: data.settings.retention_days || 30,
          backup_time: data.settings.backup_time || "02:00",
          include_attachments: data.settings.include_attachments === 1,
        });
      }
    } catch (error: any) {
      console.error("Error fetching backup settings:", error);
    }
  };

  const fetchAuditSettings = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/settings/audit`);
      const data = await response.json();
      
      if (data.success) {
        setAuditSettings(data.settings);
        setAuditForm({
          retention_days: data.settings.retention_days || 90,
          log_failed_logins: data.settings.log_failed_logins === 1,
          log_successful_logins: data.settings.log_successful_logins === 1,
          log_api_calls: data.settings.log_api_calls === 1,
          log_data_changes: data.settings.log_data_changes === 1,
          log_exports: data.settings.log_exports === 1,
        });
      }
    } catch (error: any) {
      console.error("Error fetching audit settings:", error);
    }
  };

  const fetchTaxRates = async () => {
    try {
      setLoading(prev => ({ ...prev, taxes: true }));
      const response = await authFetch(`${API_BASE_URL}/api/settings/tax-rates`);
      const data = await response.json();
      
      if (data.success) {
        setTaxRates(data.tax_rates || []);
      }
    } catch (error: any) {
      console.error("Error fetching tax rates:", error);
      toast.error("Failed to load tax rates", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, taxes: false }));
    }
  };

  const fetchPaymentTerms = async () => {
    try {
      setLoading(prev => ({ ...prev, terms: true }));
      const response = await authFetch(`${API_BASE_URL}/api/settings/payment-terms`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentTerms(data.payment_terms || []);
      }
    } catch (error: any) {
      console.error("Error fetching payment terms:", error);
      toast.error("Failed to load payment terms", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, terms: false }));
    }
  };

  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPermission("settings.edit")) {
      toast.error("Access Denied", {
        description: "You don't have permission to edit system settings"
      });
      return;
    }

    setLoading(prev => ({ ...prev, saving: true }));

    try {
      const response = await authFetch(`${API_BASE_URL}/api/settings/system`, {
        method: "PUT",
        body: JSON.stringify({
          ...systemForm,
          updated_by: currentUser?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("System settings updated successfully");
        fetchSystemSettings();
      } else {
        throw new Error(data.message || "Failed to update settings");
      }
    } catch (error: any) {
      console.error("Error updating system settings:", error);
      toast.error("Failed to update settings", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPermission("settings.edit")) {
      toast.error("Access Denied", {
        description: "You don't have permission to edit email settings"
      });
      return;
    }

    setLoading(prev => ({ ...prev, saving: true }));

    try {
      const response = await authFetch(`${API_BASE_URL}/api/settings/email`, {
        method: "PUT",
        body: JSON.stringify({
          ...emailForm,
          updated_by: currentUser?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Email settings updated successfully");
        fetchEmailSettings();
      } else {
        throw new Error(data.message || "Failed to update email settings");
      }
    } catch (error: any) {
      console.error("Error updating email settings:", error);
      toast.error("Failed to update email settings", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleTestEmail = async () => {
    if (!hasPermission("settings.edit")) {
      toast.error("Access Denied", {
        description: "You don't have permission to test email settings"
      });
      return;
    }

    try {
      toast.info("Sending test email...");
      
      const response = await authFetch(`${API_BASE_URL}/api/settings/email/test`, {
        method: "POST",
        body: JSON.stringify({
          to: currentUser?.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Test email sent successfully");
      } else {
        throw new Error(data.message || "Failed to send test email");
      }
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast.error("Failed to send test email", {
        description: error.message
      });
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPermission("settings.edit")) {
      toast.error("Access Denied", {
        description: "You don't have permission to edit notification settings"
      });
      return;
    }

    setLoading(prev => ({ ...prev, saving: true }));

    try {
      const response = await authFetch(`${API_BASE_URL}/api/settings/notifications`, {
        method: "PUT",
        body: JSON.stringify({
          ...notificationSettings,
          updated_by: currentUser?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Notification settings updated successfully");
      } else {
        throw new Error(data.message || "Failed to update notification settings");
      }
    } catch (error: any) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update notification settings", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleBackupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPermission("settings.edit")) {
      toast.error("Access Denied", {
        description: "You don't have permission to edit backup settings"
      });
      return;
    }

    setLoading(prev => ({ ...prev, saving: true }));

    try {
      const response = await authFetch(`${API_BASE_URL}/api/settings/backup`, {
        method: "PUT",
        body: JSON.stringify({
          ...backupForm,
          updated_by: currentUser?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Backup settings updated successfully");
        fetchBackupSettings();
      } else {
        throw new Error(data.message || "Failed to update backup settings");
      }
    } catch (error: any) {
      console.error("Error updating backup settings:", error);
      toast.error("Failed to update backup settings", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleCreateBackup = async () => {
    if (!hasPermission("settings.edit")) {
      toast.error("Access Denied", {
        description: "You don't have permission to create backups"
      });
      return;
    }

    try {
      toast.info("Creating backup...");
      
      const response = await authFetch(`${API_BASE_URL}/api/settings/backup/create`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Backup created successfully");
        fetchBackupSettings();
      } else {
        throw new Error(data.message || "Failed to create backup");
      }
    } catch (error: any) {
      console.error("Error creating backup:", error);
      toast.error("Failed to create backup", {
        description: error.message
      });
    }
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPermission("settings.edit")) {
      toast.error("Access Denied", {
        description: "You don't have permission to edit audit settings"
      });
      return;
    }

    setLoading(prev => ({ ...prev, saving: true }));

    try {
      const response = await authFetch(`${API_BASE_URL}/api/settings/audit`, {
        method: "PUT",
        body: JSON.stringify({
          ...auditForm,
          updated_by: currentUser?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Audit settings updated successfully");
      } else {
        throw new Error(data.message || "Failed to update audit settings");
      }
    } catch (error: any) {
      console.error("Error updating audit settings:", error);
      toast.error("Failed to update audit settings", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleTaxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPermission("settings.edit")) {
      toast.error("Access Denied", {
        description: "You don't have permission to edit tax rates"
      });
      return;
    }

    setLoading(prev => ({ ...prev, saving: true }));

    try {
      let response;
      
      if (editingTax) {
        response = await authFetch(`${API_BASE_URL}/api/settings/tax-rates/${editingTax.id}`, {
          method: "PUT",
          body: JSON.stringify(taxForm),
        });
      } else {
        response = await authFetch(`${API_BASE_URL}/api/settings/tax-rates`, {
          method: "POST",
          body: JSON.stringify(taxForm),
        });
      }

      const data = await response.json();

      if (data.success) {
        toast.success(editingTax ? "Tax rate updated successfully" : "Tax rate created successfully");
        fetchTaxRates();
        setIsTaxDialogOpen(false);
        setEditingTax(null);
        setTaxForm({
          name: "",
          rate: 16,
          type: "VAT",
          is_default: false,
          is_active: true,
          description: "",
        });
      } else {
        throw new Error(data.message || "Failed to save tax rate");
      }
    } catch (error: any) {
      console.error("Error saving tax rate:", error);
      toast.error("Failed to save tax rate", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleDeleteTax = async (taxId: number) => {
    if (!hasPermission("settings.edit")) {
      toast.error("Access Denied", {
        description: "You don't have permission to delete tax rates"
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this tax rate? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/settings/tax-rates/${taxId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Tax rate deleted successfully");
        fetchTaxRates();
      } else {
        throw new Error(data.message || "Failed to delete tax rate");
      }
    } catch (error: any) {
      console.error("Error deleting tax rate:", error);
      toast.error("Failed to delete tax rate", {
        description: error.message
      });
    }
  };

  const handleTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPermission("settings.edit")) {
      toast.error("Access Denied", {
        description: "You don't have permission to edit payment terms"
      });
      return;
    }

    setLoading(prev => ({ ...prev, saving: true }));

    try {
      let response;
      
      if (editingTerm) {
        response = await authFetch(`${API_BASE_URL}/api/settings/payment-terms/${editingTerm.id}`, {
          method: "PUT",
          body: JSON.stringify(termForm),
        });
      } else {
        response = await authFetch(`${API_BASE_URL}/api/settings/payment-terms`, {
          method: "POST",
          body: JSON.stringify(termForm),
        });
      }

      const data = await response.json();

      if (data.success) {
        toast.success(editingTerm ? "Payment term updated successfully" : "Payment term created successfully");
        fetchPaymentTerms();
        setIsTermDialogOpen(false);
        setEditingTerm(null);
        setTermForm({
          name: "",
          days: 30,
          is_default: false,
          is_active: true,
          description: "",
        });
      } else {
        throw new Error(data.message || "Failed to save payment term");
      }
    } catch (error: any) {
      console.error("Error saving payment term:", error);
      toast.error("Failed to save payment term", {
        description: error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const handleDeleteTerm = async (termId: number) => {
    if (!hasPermission("settings.edit")) {
      toast.error("Access Denied", {
        description: "You don't have permission to delete payment terms"
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this payment term? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/settings/payment-terms/${termId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Payment term deleted successfully");
        fetchPaymentTerms();
      } else {
        throw new Error(data.message || "Failed to delete payment term");
      }
    } catch (error: any) {
      console.error("Error deleting payment term:", error);
      toast.error("Failed to delete payment term", {
        description: error.message
      });
    }
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Timezone options
  const timezones = [
    "Africa/Nairobi",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "Africa/Cairo",
    "Africa/Casablanca",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Dubai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];

  const dateFormats = [
    { value: "MMM dd, yyyy", label: "Jan 01, 2024" },
    { value: "dd/MM/yyyy", label: "01/01/2024" },
    { value: "MM/dd/yyyy", label: "01/01/2024" },
    { value: "yyyy-MM-dd", label: "2024-01-01" },
    { value: "dd-MM-yyyy", label: "01-01-2024" },
    { value: "dd MMM yyyy", label: "01 Jan 2024" },
  ];

  const timeFormats = [
    { value: "HH:mm:ss", label: "14:30:45 (24-hour)" },
    { value: "HH:mm", label: "14:30 (24-hour)" },
    { value: "hh:mm:ss a", label: "02:30:45 PM (12-hour)" },
    { value: "hh:mm a", label: "02:30 PM (12-hour)" },
  ];

  const currencies = [
    { code: "KES", name: "Kenyan Shilling", symbol: "KSH" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "UGX", name: "Ugandan Shilling", symbol: "UGX" },
    { code: "TZS", name: "Tanzanian Shilling", symbol: "TZS" },
    { code: "RWF", name: "Rwandan Franc", symbol: "RWF" },
    { code: "ZAR", name: "South African Rand", symbol: "R" },
  ];

  // Show auth loading state
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Show not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show permission denied
  if (!hasPermission("settings.view")) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              Access Restricted
            </CardTitle>
            <CardDescription className="text-center">
              You don't have permission to view system settings.
              Please contact your administrator for access.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PermissionGuard permissionCode="settings.view" action="view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Configure system preferences, company information, and application settings
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={fetchAllSettings} disabled={loading.system}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading.system ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="general">
              <Building className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="company">
              <Home className="mr-2 h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="financial">
              <DollarSign className="mr-2 h-4 w-4" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="backup">
              <Database className="mr-2 h-4 w-4" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Activity className="mr-2 h-4 w-4" />
              Audit
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General System Settings</CardTitle>
                <CardDescription>
                  Configure basic system preferences and display options
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSystemSubmit}>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Date Format */}
                    <div className="space-y-2">
                      <Label htmlFor="date_format">Date Format</Label>
                      <Select
                        value={systemForm.date_format}
                        onValueChange={(value) => setSystemForm({ ...systemForm, date_format: value })}
                        disabled={!hasPermission("settings.edit")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          {dateFormats.map((format) => (
                            <SelectItem key={format.value} value={format.value}>
                              {format.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Time Format */}
                    <div className="space-y-2">
                      <Label htmlFor="time_format">Time Format</Label>
                      <Select
                        value={systemForm.time_format}
                        onValueChange={(value) => setSystemForm({ ...systemForm, time_format: value })}
                        disabled={!hasPermission("settings.edit")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time format" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeFormats.map((format) => (
                            <SelectItem key={format.value} value={format.value}>
                              {format.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={systemForm.timezone}
                        onValueChange={(value) => setSystemForm({ ...systemForm, timezone: value })}
                        disabled={!hasPermission("settings.edit")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={systemForm.currency}
                        onValueChange={(value) => {
                          const currency = currencies.find(c => c.code === value);
                          setSystemForm({ 
                            ...systemForm, 
                            currency: value,
                            currency_symbol: currency?.symbol || "KSH"
                          });
                        }}
                        disabled={!hasPermission("settings.edit")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.name} ({currency.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Currency Symbol */}
                    <div className="space-y-2">
                      <Label htmlFor="currency_symbol">Currency Symbol</Label>
                      <Input
                        id="currency_symbol"
                        value={systemForm.currency_symbol}
                        onChange={(e) => setSystemForm({ ...systemForm, currency_symbol: e.target.value })}
                        placeholder="e.g., KSH, $, €"
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>

                    {/* VAT Rate */}
                    <div className="space-y-2">
                      <Label htmlFor="vat_rate">Default VAT Rate (%)</Label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="vat_rate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={systemForm.vat_rate}
                          onChange={(e) => setSystemForm({ ...systemForm, vat_rate: parseFloat(e.target.value) || 0 })}
                          className="pl-9"
                          disabled={!hasPermission("settings.edit")}
                        />
                      </div>
                    </div>

                    {/* Fiscal Year Start */}
                    <div className="space-y-2">
                      <Label htmlFor="fiscal_year_start">Fiscal Year Start</Label>
                      <Input
                        id="fiscal_year_start"
                        type="date"
                        value={systemForm.fiscal_year_start}
                        onChange={(e) => setSystemForm({ ...systemForm, fiscal_year_start: e.target.value })}
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>

                    {/* Fiscal Year End */}
                    <div className="space-y-2">
                      <Label htmlFor="fiscal_year_end">Fiscal Year End</Label>
                      <Input
                        id="fiscal_year_end"
                        type="date"
                        value={systemForm.fiscal_year_end}
                        onChange={(e) => setSystemForm({ ...systemForm, fiscal_year_end: e.target.value })}
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <div className="flex justify-end w-full">
                    <Button 
                      type="submit" 
                      disabled={loading.saving || !hasPermission("settings.edit")}
                    >
                      {loading.saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Company Settings Tab */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Update your company details that will appear on invoices, reports, and documents
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSystemSubmit}>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Company Name */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="company_name">Company Name *</Label>
                      <Input
                        id="company_name"
                        value={systemForm.company_name}
                        onChange={(e) => setSystemForm({ ...systemForm, company_name: e.target.value })}
                        placeholder="Enter company name"
                        required
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>

                    {/* Company Address */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="company_address">Company Address</Label>
                      <Textarea
                        id="company_address"
                        value={systemForm.company_address}
                        onChange={(e) => setSystemForm({ ...systemForm, company_address: e.target.value })}
                        placeholder="Enter company address"
                        rows={3}
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>

                    {/* Company Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="company_phone">Phone Number</Label>
                      <Input
                        id="company_phone"
                        value={systemForm.company_phone}
                        onChange={(e) => setSystemForm({ ...systemForm, company_phone: e.target.value })}
                        placeholder="e.g., +254 700 123456"
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>

                    {/* Company Email */}
                    <div className="space-y-2">
                      <Label htmlFor="company_email">Email Address</Label>
                      <Input
                        id="company_email"
                        type="email"
                        value={systemForm.company_email}
                        onChange={(e) => setSystemForm({ ...systemForm, company_email: e.target.value })}
                        placeholder="info@company.com"
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>

                    {/* Company Website */}
                    <div className="space-y-2">
                      <Label htmlFor="company_website">Website</Label>
                      <Input
                        id="company_website"
                        value={systemForm.company_website}
                        onChange={(e) => setSystemForm({ ...systemForm, company_website: e.target.value })}
                        placeholder="https://www.company.com"
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>

                    {/* Tax ID */}
                    <div className="space-y-2">
                      <Label htmlFor="company_tax_id">Tax ID / VAT Number</Label>
                      <Input
                        id="company_tax_id"
                        value={systemForm.company_tax_id}
                        onChange={(e) => setSystemForm({ ...systemForm, company_tax_id: e.target.value })}
                        placeholder="e.g., P-000-123-456"
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <div className="flex justify-end w-full">
                    <Button 
                      type="submit" 
                      disabled={loading.saving || !hasPermission("settings.edit")}
                    >
                      {loading.saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>

            {/* Tax Rates */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tax Rates</CardTitle>
                    <CardDescription>
                      Configure tax rates used in purchases and invoices
                    </CardDescription>
                  </div>
                  <PermissionGuard permissionCode="settings.edit" action="edit">
                    <Button onClick={() => {
                      setEditingTax(null);
                      setTaxForm({
                        name: "",
                        rate: 16,
                        type: "VAT",
                        is_default: false,
                        is_active: true,
                        description: "",
                      });
                      setIsTaxDialogOpen(true);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Tax Rate
                    </Button>
                  </PermissionGuard>
                </div>
              </CardHeader>
              <CardContent>
                {loading.taxes ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading tax rates...</p>
                    </div>
                  </div>
                ) : taxRates.length === 0 ? (
                  <div className="text-center py-8">
                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No tax rates configured</h3>
                    <p className="text-muted-foreground">
                      Add tax rates to use in purchase orders and invoices
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taxRates.map((tax) => (
                          <TableRow key={tax.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{tax.name}</div>
                                {tax.description && (
                                  <div className="text-sm text-muted-foreground">{tax.description}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {tax.rate}%
                              </Badge>
                            </TableCell>
                            <TableCell>{tax.type}</TableCell>
                            <TableCell>
                              {tax.is_active ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {tax.is_default ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <PermissionGuard permissionCode="settings.edit" action="edit">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      setEditingTax(tax);
                                      setTaxForm({
                                        name: tax.name,
                                        rate: tax.rate,
                                        type: tax.type,
                                        is_default: tax.is_default === 1,
                                        is_active: tax.is_active === 1,
                                        description: tax.description || "",
                                      });
                                      setIsTaxDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </PermissionGuard>
                                <PermissionGuard permissionCode="settings.edit" action="delete">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleDeleteTax(tax.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </PermissionGuard>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payment Terms</CardTitle>
                    <CardDescription>
                      Configure payment terms for suppliers and customers
                    </CardDescription>
                  </div>
                  <PermissionGuard permissionCode="settings.edit" action="edit">
                    <Button onClick={() => {
                      setEditingTerm(null);
                      setTermForm({
                        name: "",
                        days: 30,
                        is_default: false,
                        is_active: true,
                        description: "",
                      });
                      setIsTermDialogOpen(true);
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment Term
                    </Button>
                  </PermissionGuard>
                </div>
              </CardHeader>
              <CardContent>
                {loading.terms ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading payment terms...</p>
                    </div>
                  </div>
                ) : paymentTerms.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No payment terms configured</h3>
                    <p className="text-muted-foreground">
                      Add payment terms for supplier invoices
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentTerms.map((term) => (
                          <TableRow key={term.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{term.name}</div>
                                {term.description && (
                                  <div className="text-sm text-muted-foreground">{term.description}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{term.days} days</Badge>
                            </TableCell>
                            <TableCell>
                              {term.is_active ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {term.is_default ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <PermissionGuard permissionCode="settings.edit" action="edit">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      setEditingTerm(term);
                                      setTermForm({
                                        name: term.name,
                                        days: term.days,
                                        is_default: term.is_default === 1,
                                        is_active: term.is_active === 1,
                                        description: term.description || "",
                                      });
                                      setIsTermDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </PermissionGuard>
                                <PermissionGuard permissionCode="settings.edit" action="delete">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleDeleteTerm(term.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </PermissionGuard>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>
                  Configure SMTP settings for sending system emails
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2 pb-4">
                    <Switch
                      id="email_enabled"
                      checked={emailForm.enabled}
                      onCheckedChange={(checked) => setEmailForm({ ...emailForm, enabled: checked })}
                      disabled={!hasPermission("settings.edit")}
                    />
                    <Label htmlFor="email_enabled">Enable Email Notifications</Label>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* SMTP Host */}
                    <div className="space-y-2">
                      <Label htmlFor="smtp_host">SMTP Host *</Label>
                      <Input
                        id="smtp_host"
                        value={emailForm.smtp_host}
                        onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                        placeholder="e.g., smtp.gmail.com"
                        required={emailForm.enabled}
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>

                    {/* SMTP Port */}
                    <div className="space-y-2">
                      <Label htmlFor="smtp_port">SMTP Port *</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        value={emailForm.smtp_port}
                        onChange={(e) => setEmailForm({ ...emailForm, smtp_port: parseInt(e.target.value) || 587 })}
                        placeholder="587"
                        required={emailForm.enabled}
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>

                    {/* SMTP Encryption */}
                    <div className="space-y-2">
                      <Label htmlFor="smtp_encryption">Encryption</Label>
                      <Select
                        value={emailForm.smtp_encryption}
                        onValueChange={(value: "tls" | "ssl" | "none") => 
                          setEmailForm({ ...emailForm, smtp_encryption: value })
                        }
                        disabled={!hasPermission("settings.edit")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select encryption" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* SMTP Username */}
                    <div className="space-y-2">
                      <Label htmlFor="smtp_username">SMTP Username</Label>
                      <Input
                        id="smtp_username"
                        value={emailForm.smtp_username}
                        onChange={(e) => setEmailForm({ ...emailForm, smtp_username: e.target.value })}
                        placeholder="username@example.com"
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>

                    {/* SMTP Password */}
                    <div className="space-y-2">
                      <Label htmlFor="smtp_password">SMTP Password</Label>
                      <div className="relative">
                        <Input
                          id="smtp_password"
                          type={showEmailPassword ? "text" : "password"}
                          value={emailForm.smtp_password}
                          onChange={(e) => setEmailForm({ ...emailForm, smtp_password: e.target.value })}
                          placeholder="Enter password"
                          disabled={!hasPermission("settings.edit")}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowEmailPassword(!showEmailPassword)}
                          disabled={!hasPermission("settings.edit")}
                        >
                          {showEmailPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Leave blank to keep current password
                      </p>
                    </div>

                    {/* From Email */}
                    <div className="space-y-2">
                      <Label htmlFor="from_email">From Email *</Label>
                      <Input
                        id="from_email"
                        type="email"
                        value={emailForm.from_email}
                        onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })}
                        placeholder="noreply@company.com"
                        required={emailForm.enabled}
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>

                    {/* From Name */}
                    <div className="space-y-2">
                      <Label htmlFor="from_name">From Name *</Label>
                      <Input
                        id="from_name"
                        value={emailForm.from_name}
                        onChange={(e) => setEmailForm({ ...emailForm, from_name: e.target.value })}
                        placeholder="Company Name"
                        required={emailForm.enabled}
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>

                    {/* Reply To */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="reply_to">Reply-To Address</Label>
                      <Input
                        id="reply_to"
                        type="email"
                        value={emailForm.reply_to || ""}
                        onChange={(e) => setEmailForm({ ...emailForm, reply_to: e.target.value })}
                        placeholder="support@company.com"
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>
                  </div>


                  {emailSettings && (
                    <div className="text-sm text-muted-foreground border-t pt-4">
                      Last updated: {formatDate(new Date(emailSettings.updated_at), "PPPpp")}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <div className="flex justify-between w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestEmail}
                      disabled={!hasPermission("settings.edit")}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Test Connection
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading.saving || !hasPermission("settings.edit")}
                    >
                      {loading.saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure which system events trigger notifications
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleNotificationSubmit}>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">General Notifications</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="email_notifications">Email Notifications</Label>
                            <p className="text-xs text-muted-foreground">
                              Receive notifications via email
                            </p>
                          </div>
                          <Switch
                            id="email_notifications"
                            checked={notificationSettings.email_notifications}
                            onCheckedChange={(checked) => 
                              setNotificationSettings({ ...notificationSettings, email_notifications: checked })
                            }
                            disabled={!hasPermission("settings.edit")}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="system_notifications">System Notifications</Label>
                            <p className="text-xs text-muted-foreground">
                              Show notifications in the system
                            </p>
                          </div>
                          <Switch
                            id="system_notifications"
                            checked={notificationSettings.system_notifications}
                            onCheckedChange={(checked) => 
                              setNotificationSettings({ ...notificationSettings, system_notifications: checked })
                            }
                            disabled={!hasPermission("settings.edit")}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Business Alerts</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="purchase_order_alerts">Purchase Orders</Label>
                            <p className="text-xs text-muted-foreground">
                              New purchase orders and receipts
                            </p>
                          </div>
                          <Switch
                            id="purchase_order_alerts"
                            checked={notificationSettings.purchase_order_alerts}
                            onCheckedChange={(checked) => 
                              setNotificationSettings({ ...notificationSettings, purchase_order_alerts: checked })
                            }
                            disabled={!hasPermission("settings.edit")}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="low_stock_alerts">Low Stock</Label>
                            <p className="text-xs text-muted-foreground">
                              Tires below minimum stock level
                            </p>
                          </div>
                          <Switch
                            id="low_stock_alerts"
                            checked={notificationSettings.low_stock_alerts}
                            onCheckedChange={(checked) => 
                              setNotificationSettings({ ...notificationSettings, low_stock_alerts: checked })
                            }
                            disabled={!hasPermission("settings.edit")}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="retread_due_alerts">Retread Due</Label>
                            <p className="text-xs text-muted-foreground">
                              Tires due for retreading
                            </p>
                          </div>
                          <Switch
                            id="retread_due_alerts"
                            checked={notificationSettings.retread_due_alerts}
                            onCheckedChange={(checked) => 
                              setNotificationSettings({ ...notificationSettings, retread_due_alerts: checked })
                            }
                            disabled={!hasPermission("settings.edit")}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Security Alerts</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="user_login_alerts">User Logins</Label>
                            <p className="text-xs text-muted-foreground">
                              Successful user logins
                            </p>
                          </div>
                          <Switch
                            id="user_login_alerts"
                            checked={notificationSettings.user_login_alerts}
                            onCheckedChange={(checked) => 
                              setNotificationSettings({ ...notificationSettings, user_login_alerts: checked })
                            }
                            disabled={!hasPermission("settings.edit")}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Reports</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="daily_summary">Daily Summary</Label>
                            <p className="text-xs text-muted-foreground">
                              End of day summary report
                            </p>
                          </div>
                          <Switch
                            id="daily_summary"
                            checked={notificationSettings.daily_summary}
                            onCheckedChange={(checked) => 
                              setNotificationSettings({ ...notificationSettings, daily_summary: checked })
                            }
                            disabled={!hasPermission("settings.edit")}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="weekly_report">Weekly Report</Label>
                            <p className="text-xs text-muted-foreground">
                              Weekly performance report
                            </p>
                          </div>
                          <Switch
                            id="weekly_report"
                            checked={notificationSettings.weekly_report}
                            onCheckedChange={(checked) => 
                              setNotificationSettings({ ...notificationSettings, weekly_report: checked })
                            }
                            disabled={!hasPermission("settings.edit")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <div className="flex justify-end w-full">
                    <Button 
                      type="submit" 
                      disabled={loading.saving || !hasPermission("settings.edit")}
                    >
                      {loading.saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Financial Settings Tab */}
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Settings</CardTitle>
                <CardDescription>
                  Configure financial defaults and accounting preferences
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSystemSubmit}>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Default Tax Rate */}
                    <div className="space-y-2">
                      <Label htmlFor="vat_rate">Default Tax Rate (%)</Label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="vat_rate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={systemForm.vat_rate}
                          onChange={(e) => setSystemForm({ ...systemForm, vat_rate: parseFloat(e.target.value) || 0 })}
                          className="pl-9"
                          disabled={!hasPermission("settings.edit")}
                        />
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="space-y-2">
                      <Label htmlFor="currency">Base Currency</Label>
                      <Select
                        value={systemForm.currency}
                        onValueChange={(value) => {
                          const currency = currencies.find(c => c.code === value);
                          setSystemForm({ 
                            ...systemForm, 
                            currency: value,
                            currency_symbol: currency?.symbol || "KSH"
                          });
                        }}
                        disabled={!hasPermission("settings.edit")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.name} ({currency.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fiscal Year Start */}
                    <div className="space-y-2">
                      <Label htmlFor="fiscal_year_start">Fiscal Year Start</Label>
                      <Input
                        id="fiscal_year_start"
                        type="date"
                        value={systemForm.fiscal_year_start}
                        onChange={(e) => setSystemForm({ ...systemForm, fiscal_year_start: e.target.value })}
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>

                    {/* Fiscal Year End */}
                    <div className="space-y-2">
                      <Label htmlFor="fiscal_year_end">Fiscal Year End</Label>
                      <Input
                        id="fiscal_year_end"
                        type="date"
                        value={systemForm.fiscal_year_end}
                        onChange={(e) => setSystemForm({ ...systemForm, fiscal_year_end: e.target.value })}
                        disabled={!hasPermission("settings.edit")}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <div className="flex justify-end w-full">
                    <Button 
                      type="submit" 
                      disabled={loading.saving || !hasPermission("settings.edit")}
                    >
                      {loading.saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Backup Settings Tab */}
          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Backup Configuration</CardTitle>
                <CardDescription>
                  Configure automated database backups and retention policies
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleBackupSubmit}>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2 pb-4">
                    <Switch
                      id="backup_enabled"
                      checked={backupForm.enabled}
                      onCheckedChange={(checked) => setBackupForm({ ...backupForm, enabled: checked })}
                      disabled={!hasPermission("settings.edit")}
                    />
                    <Label htmlFor="backup_enabled">Enable Automated Backups</Label>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Backup Frequency */}
                    <div className="space-y-2">
                      <Label htmlFor="backup_frequency">Backup Frequency</Label>
                      <Select
                        value={backupForm.frequency}
                        onValueChange={(value: "daily" | "weekly" | "monthly") => 
                          setBackupForm({ ...backupForm, frequency: value })
                        }
                        disabled={!backupForm.enabled || !hasPermission("settings.edit")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Retention Days */}
                    <div className="space-y-2">
                      <Label htmlFor="retention_days">Retention Period (days)</Label>
                      <Input
                        id="retention_days"
                        type="number"
                        min="1"
                        max="365"
                        value={backupForm.retention_days}
                        onChange={(e) => setBackupForm({ ...backupForm, retention_days: parseInt(e.target.value) || 30 })}
                        disabled={!backupForm.enabled || !hasPermission("settings.edit")}
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of days to keep backups before deletion
                      </p>
                    </div>

                    {/* Backup Time */}
                    <div className="space-y-2">
                      <Label htmlFor="backup_time">Backup Time</Label>
                      <Input
                        id="backup_time"
                        type="time"
                        value={backupForm.backup_time}
                        onChange={(e) => setBackupForm({ ...backupForm, backup_time: e.target.value })}
                        disabled={!backupForm.enabled || !hasPermission("settings.edit")}
                      />
                    </div>

                    {/* Include Attachments */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          id="include_attachments"
                          checked={backupForm.include_attachments}
                          onCheckedChange={(checked) => 
                            setBackupForm({ ...backupForm, include_attachments: checked })
                          }
                          disabled={!backupForm.enabled || !hasPermission("settings.edit")}
                        />
                        <Label htmlFor="include_attachments">Include File Attachments</Label>
                      </div>
                    </div>
                  </div>

                  {backupSettings && (
                    <div className="rounded-lg bg-muted p-4 mt-4">
                      <h4 className="text-sm font-medium mb-2">Last Backup Information</h4>
                      <div className="grid gap-2 md:grid-cols-3">
                        <div>
                          <span className="text-xs text-muted-foreground">Last Backup</span>
                            <p className="text-sm font-medium">
                              {backupSettings.last_backup
                                ? formatDate(new Date(backupSettings.last_backup), "PPPpp")
                                : "Never"}
                            </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Size</span>
                          <p className="text-sm font-medium">
                            {formatBytes(backupSettings.last_backup_size)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Status</span>
                          <p className="text-sm font-medium">
                            {backupSettings.last_backup_status === "success" ? (
                              <span className="text-green-600 dark:text-green-400">Success</span>
                            ) : backupSettings.last_backup_status ? (
                              <span className="text-red-600 dark:text-red-400">Failed</span>
                            ) : (
                              "N/A"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <div className="flex justify-between w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCreateBackup}
                      disabled={!hasPermission("settings.edit")}
                    >
                      <Database className="mr-2 h-4 w-4" />
                      Create Backup Now
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading.saving || !hasPermission("settings.edit")}
                    >
                      {loading.saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Audit Settings Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log Configuration</CardTitle>
                <CardDescription>
                  Configure audit logging settings and retention policies
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleAuditSubmit}>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Retention Days */}
                    <div className="space-y-2">
                      <Label htmlFor="audit_retention">Audit Log Retention (days)</Label>
                      <Input
                        id="audit_retention"
                        type="number"
                        min="1"
                        max="3650"
                        value={auditForm.retention_days}
                        onChange={(e) => setAuditForm({ ...auditForm, retention_days: parseInt(e.target.value) || 90 })}
                        disabled={!hasPermission("settings.edit")}
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of days to keep audit logs (0 = indefinite)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Events to Log</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="log_failed_logins">Failed Login Attempts</Label>
                        <Switch
                          id="log_failed_logins"
                          checked={auditForm.log_failed_logins}
                          onCheckedChange={(checked) => 
                            setAuditForm({ ...auditForm, log_failed_logins: checked })
                          }
                          disabled={!hasPermission("settings.edit")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="log_successful_logins">Successful Logins</Label>
                        <Switch
                          id="log_successful_logins"
                          checked={auditForm.log_successful_logins}
                          onCheckedChange={(checked) => 
                            setAuditForm({ ...auditForm, log_successful_logins: checked })
                          }
                          disabled={!hasPermission("settings.edit")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="log_api_calls">API Calls</Label>
                        <Switch
                          id="log_api_calls"
                          checked={auditForm.log_api_calls}
                          onCheckedChange={(checked) => 
                            setAuditForm({ ...auditForm, log_api_calls: checked })
                          }
                          disabled={!hasPermission("settings.edit")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="log_data_changes">Data Changes</Label>
                        <Switch
                          id="log_data_changes"
                          checked={auditForm.log_data_changes}
                          onCheckedChange={(checked) => 
                            setAuditForm({ ...auditForm, log_data_changes: checked })
                          }
                          disabled={!hasPermission("settings.edit")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="log_exports">Data Exports</Label>
                        <Switch
                          id="log_exports"
                          checked={auditForm.log_exports}
                          onCheckedChange={(checked) => 
                            setAuditForm({ ...auditForm, log_exports: checked })
                          }
                          disabled={!hasPermission("settings.edit")}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <div className="flex justify-end w-full">
                    <Button 
                      type="submit" 
                      disabled={loading.saving || !hasPermission("settings.edit")}
                    >
                      {loading.saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Tax Rate Dialog */}
        <Dialog open={isTaxDialogOpen} onOpenChange={setIsTaxDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTax ? "Edit Tax Rate" : "Add Tax Rate"}</DialogTitle>
              <DialogDescription>
                {editingTax 
                  ? "Update the tax rate details below" 
                  : "Create a new tax rate for use in purchases and invoices"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTaxSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_name">Tax Name *</Label>
                  <Input
                    id="tax_name"
                    value={taxForm.name}
                    onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
                    placeholder="e.g., Standard VAT, Service Tax"
                    required
                    disabled={loading.saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Tax Rate (%) *</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tax_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={taxForm.rate}
                      onChange={(e) => setTaxForm({ ...taxForm, rate: parseFloat(e.target.value) || 0 })}
                      className="pl-9"
                      required
                      disabled={loading.saving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_type">Tax Type</Label>
                  <Select
                    value={taxForm.type}
                    onValueChange={(value: "VAT" | "SERVICE" | "OTHER") => 
                      setTaxForm({ ...taxForm, type: value })
                    }
                    disabled={loading.saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VAT">VAT</SelectItem>
                      <SelectItem value="SERVICE">Service Tax</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_description">Description</Label>
                  <Textarea
                    id="tax_description"
                    value={taxForm.description}
                    onChange={(e) => setTaxForm({ ...taxForm, description: e.target.value })}
                    placeholder="Brief description of this tax rate"
                    rows={2}
                    disabled={loading.saving}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="tax_is_default"
                    checked={taxForm.is_default}
                    onCheckedChange={(checked) => setTaxForm({ ...taxForm, is_default: checked })}
                    disabled={loading.saving}
                  />
                  <Label htmlFor="tax_is_default">Set as default tax rate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="tax_is_active"
                    checked={taxForm.is_active}
                    onCheckedChange={(checked) => setTaxForm({ ...taxForm, is_active: checked })}
                    disabled={loading.saving}
                  />
                  <Label htmlFor="tax_is_active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTaxDialogOpen(false)}
                  disabled={loading.saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading.saving}>
                  {loading.saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingTax ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingTax ? "Update Tax Rate" : "Create Tax Rate"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Term Dialog */}
        <Dialog open={isTermDialogOpen} onOpenChange={setIsTermDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTerm ? "Edit Payment Term" : "Add Payment Term"}</DialogTitle>
              <DialogDescription>
                {editingTerm 
                  ? "Update the payment term details below" 
                  : "Create a new payment term for supplier invoices"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTermSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="term_name">Term Name *</Label>
                  <Input
                    id="term_name"
                    value={termForm.name}
                    onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                    placeholder="e.g., Net 30, Due on Receipt"
                    required
                    disabled={loading.saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term_days">Days *</Label>
                  <Input
                    id="term_days"
                    type="number"
                    min="0"
                    max="365"
                    value={termForm.days}
                    onChange={(e) => setTermForm({ ...termForm, days: parseInt(e.target.value) || 0 })}
                    placeholder="30"
                    required
                    disabled={loading.saving}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of days after invoice date (0 = due on receipt)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term_description">Description</Label>
                  <Textarea
                    id="term_description"
                    value={termForm.description}
                    onChange={(e) => setTermForm({ ...termForm, description: e.target.value })}
                    placeholder="Brief description of this payment term"
                    rows={2}
                    disabled={loading.saving}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="term_is_default"
                    checked={termForm.is_default}
                    onCheckedChange={(checked) => setTermForm({ ...termForm, is_default: checked })}
                    disabled={loading.saving}
                  />
                  <Label htmlFor="term_is_default">Set as default payment term</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="term_is_active"
                    checked={termForm.is_active}
                    onCheckedChange={(checked) => setTermForm({ ...termForm, is_active: checked })}
                    disabled={loading.saving}
                  />
                  <Label htmlFor="term_is_active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTermDialogOpen(false)}
                  disabled={loading.saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading.saving}>
                  {loading.saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingTerm ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingTerm ? "Update Payment Term" : "Create Payment Term"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="text-xs text-muted-foreground border-t pt-4">
          Logged in as: {currentUser?.full_name || currentUser?.username} • Role: {currentUser?.role}
        </div>
      </div>
    </PermissionGuard>
  );
}