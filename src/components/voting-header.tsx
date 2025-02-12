'use client'

interface VotingHeaderProps {
  totalVoters: number
  votedCount: number
}

export function VotingHeader({ totalVoters, votedCount }: VotingHeaderProps) {
  const percentage = Math.round((votedCount / totalVoters) * 100)

  return (
    <div className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold mb-2">Pemilihan Ketua OSIS</h1>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          <div className="text-sm font-medium">
            {percentage}% telah memilih
          </div>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {votedCount} dari {totalVoters} pemilih
        </div>
      </div>
    </div>
  )
} 