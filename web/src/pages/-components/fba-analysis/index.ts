import { FbaAnalysisHeader } from './header'
import { FbaAnalysisPendingTable } from './pending-table'
import { FbaAnalysisRecommendationChart } from './recommendation-chart'
import { FbaAnalysisResultsTable } from './results-table'
import { FbaAnalysisRoot } from './root'
import { FbaAnalysisSummaryCards } from './summary-cards'
import { FbaAnalysisUploadForm } from './upload-form'

export type {
  FbaAnalysisResponse,
  FbaPendingItem,
  FbaResultItem,
  FbaSummary,
} from './types'

export const FbaAnalysis = {
  Root: FbaAnalysisRoot,
  Header: FbaAnalysisHeader,
  UploadForm: FbaAnalysisUploadForm,
  SummaryCards: FbaAnalysisSummaryCards,
  RecommendationChart: FbaAnalysisRecommendationChart,
  ResultsTable: FbaAnalysisResultsTable,
  PendingTable: FbaAnalysisPendingTable,
}
