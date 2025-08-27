import React from 'react'
import { Metadata } from 'next'
import Navbar from '@/components/navbar'
import Hero from '@/components/hero'
import RankingsContent from '@/components/rankings-content'

export const metadata: Metadata = {
  title: 'Fantasy Football Ranking Sites | Fantasy Red Zone',
  description: 'Comprehensive directory of fantasy football ranking websites and resources. Find expert analysis, player rankings, and fantasy tools from the top sources.',
  keywords: 'fantasy football sites, fantasy football rankings, fantasy football resources, fantasy football tools, fantasy football analysis',
}

export default function RankingsPage() {
  return (
    <>
      <header>
        <Navbar />
        <Hero
          title={['Fantasy Football', 'Ranking Sites']}
          description="Comprehensive directory of fantasy football ranking websites and resources. Find expert analysis, player rankings, and fantasy tools from the top sources."
        />
      </header>

      <main>
        <RankingsContent />
      </main>
    </>
  )
}
