"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

interface ClassRestriction {
  cid: string;
  limit: number;
}

interface OpenClass {
  _id: string;
  title: string;
}

interface Props {
  opensClasses: OpenClass[];
  initialRestrictions?: ClassRestriction[];
  onChange: (restrictions: ClassRestriction[]) => void;
}

export function ClassRestrictionsEditor({
  opensClasses,
  initialRestrictions = [],
  onChange,
}: Props) {
  const [restrictions, setRestrictions] =
    useState<ClassRestriction[]>(initialRestrictions);

  // Remove restrictions for classes no longer in opensClasses
  useEffect(() => {
    const validIds = new Set(opensClasses.map((c) => c._id));
    const filtered = restrictions.filter((r) => validIds.has(r.cid));
    if (filtered.length !== restrictions.length) {
      setRestrictions(filtered);
      onChange(filtered);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opensClasses]);

  const restrictedIds = new Set(restrictions.map((r) => r.cid));
  const availableClasses = opensClasses.filter((c) => !restrictedIds.has(c._id));

  const addRow = () => {
    if (availableClasses.length === 0) return;
    const next = [...restrictions, { cid: availableClasses[0]._id, limit: 1 }];
    setRestrictions(next);
    onChange(next);
  };

  const removeRow = (index: number) => {
    const next = restrictions.filter((_, i) => i !== index);
    setRestrictions(next);
    onChange(next);
  };

  const updateCid = (index: number, cid: string) => {
    const next = restrictions.map((r, i) => (i === index ? { ...r, cid } : r));
    setRestrictions(next);
    onChange(next);
  };

  const updateLimit = (index: number, value: string) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 1) return;
    const next = restrictions.map((r, i) =>
      i === index ? { ...r, limit: parsed } : r
    );
    setRestrictions(next);
    onChange(next);
  };

  if (opensClasses.length === 0) return null;

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Class Restrictions</Label>
      <p className="text-xs text-muted-foreground">
        Set monthly session limits per class for members on this package.
      </p>

      {restrictions.length > 0 && (
        <div className="space-y-2">
          {restrictions.map((restriction, index) => {
            const selectableClasses = opensClasses.filter(
              (c) => c._id === restriction.cid || !restrictedIds.has(c._id)
            );
            return (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={restriction.cid}
                  onValueChange={(val) => updateCid(index, val)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableClasses.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={restriction.limit}
                  onChange={(e) => updateLimit(index, e.target.value)}
                  className="w-20"
                  placeholder="Limit"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  / mo
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={availableClasses.length === 0}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Restriction
      </Button>
    </div>
  );
}
