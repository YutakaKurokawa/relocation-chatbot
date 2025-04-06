"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { FilterConditions } from "@/types/filters"
import { Search } from "lucide-react"

interface ConditionFiltersProps {
  filters: FilterConditions
  onChange: (filters: FilterConditions) => void
  onSearch: () => void
  isLoading: boolean
}

interface FilterCategory {
  id: keyof FilterConditions
  label: string
  options: {
    value: number
    label: string
  }[]
}

const filterCategories: FilterCategory[] = [
  {
    id: "housing",
    label: "🏠 住居支援",
    options: [
      { value: 0, label: "不要" },
      { value: 1, label: "あれば良い" },
      { value: 2, label: "重視" },
    ],
  },
  {
    id: "childcare",
    label: "👶 子育て支援",
    options: [
      { value: 0, label: "不要" },
      { value: 1, label: "普通" },
      { value: 2, label: "充実" },
    ],
  },
  {
    id: "telework",
    label: "💻 テレワーク",
    options: [
      { value: 0, label: "不要" },
      { value: 1, label: "時々" },
      { value: 2, label: "必須" },
    ],
  },
  {
    id: "climate",
    label: "☀️ 気候",
    options: [
      { value: 0, label: "無関心" },
      { value: 1, label: "雪少なめ" },
      { value: 2, label: "温暖" },
    ],
  },
  {
    id: "medicalTransport",
    label: "🏥 医療・交通",
    options: [
      { value: 0, label: "不要" },
      { value: 1, label: "最低限" },
      { value: 2, label: "充実" },
    ],
  },
  {
    id: "community",
    label: "👥 コミュニティ",
    options: [
      { value: 0, label: "不要" },
      { value: 1, label: "普通" },
      { value: 2, label: "積極的" },
    ],
  },
]

export default function ConditionFilters({ filters, onChange, onSearch, isLoading }: ConditionFiltersProps) {
  const handleFilterChange = (categoryId: keyof FilterConditions, value: number) => {
    onChange({
      ...filters,
      [categoryId]: value,
    })
  }

  return (
    <div className="p-2">
      <h2 className="text-lg font-semibold mb-4 text-slate-800">条件フィルター</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {filterCategories.map((category) => (
          <div key={category.id} className="space-y-3 p-2">
            <h3 className="font-medium text-sm text-slate-700">{category.label}</h3>
            <RadioGroup
              value={filters[category.id].toString()}
              onValueChange={(value) => handleFilterChange(category.id, Number.parseInt(value))}
              className="flex flex-col gap-2"
            >
              {category.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value.toString()} id={`${category.id}-${option.value}`} />
                  <Label htmlFor={`${category.id}-${option.value}`} className="text-xs sm:text-sm whitespace-nowrap">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>

      <Button onClick={onSearch} className="w-full mt-6 bg-slate-700 hover:bg-slate-800" disabled={isLoading}>
        <Search className="mr-2 h-4 w-4" />
        条件で検索する
      </Button>
    </div>
  )
}

