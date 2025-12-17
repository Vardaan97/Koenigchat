'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { Mail, User, Phone, Building, Loader2 } from 'lucide-react';

interface LeadCaptureFormProps {
  onSubmit: (data: { name: string; email: string; phone?: string; company?: string }) => void;
  onSkip?: () => void;
  isLoading?: boolean;
  minimal?: boolean;
  className?: string;
}

export function LeadCaptureForm({
  onSubmit,
  onSkip,
  isLoading = false,
  minimal = false,
  className,
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        company: formData.company.trim() || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3 p-4', className)}>
      <div className="text-center mb-4">
        <h4 className="font-medium text-sm">Get personalized course recommendations</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Share your details and we'll help you find the perfect course
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={cn('pl-10', errors.name && 'border-destructive')}
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={cn('pl-10', errors.email && 'border-destructive')}
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>

        {!minimal && (
          <>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="Phone number (optional)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Company (optional)"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="pl-10"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            'Get Started'
          )}
        </Button>
        {onSkip && (
          <Button type="button" variant="ghost" onClick={onSkip} disabled={isLoading}>
            Skip
          </Button>
        )}
      </div>

      <p className="text-[10px] text-center text-muted-foreground">
        By submitting, you agree to receive communications from Koenig Solutions
      </p>
    </form>
  );
}
