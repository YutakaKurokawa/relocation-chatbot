import { ExternalLink } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const handleSearch = async () => {
  try {
    const results = await fetchRecommendations(filters, chatSummary);
    setRecommendations(results);
  } catch (error) {
    console.error(error);
    // トースト表示などもここに追加OK
  }
};

interface RecommendationProps {
  recommendation: {
    location: string
    features: string[]
    quote?: string
    source_url: string
  }
}

export default function RecommendationCard({ recommendation }: RecommendationProps) {
  return (
    <Card className="border-0 shadow-none bg-slate-100/70">
      <CardContent className="p-3 space-y-3">
        <h3 className="font-bold text-lg text-slate-800">{recommendation.location}</h3>

        <div>
          <h4 className="text-sm font-medium mb-1 text-slate-700">支援制度</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {recommendation.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>

        {recommendation.quote && (
          <div>
            <h4 className="text-sm font-medium mb-1 text-slate-700">移住者の声</h4>
            <p className="text-sm italic">{recommendation.quote}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full border-slate-300 text-slate-700 hover:bg-slate-200/50"
          asChild
        >
          <a href={recommendation.source_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            公式サイトを見る
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}

