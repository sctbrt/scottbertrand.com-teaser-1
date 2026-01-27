// TEMPORARY: Debug endpoint to check leads in database
// DELETE THIS FILE AFTER DEBUGGING

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')

  try {
    if (action === 'test-create') {
      // Create a test lead to verify database connection
      const testLead = await prisma.leads.create({
        data: {
          email: `test-${Date.now()}@debug.local`,
          name: 'Debug Test Lead',
          source: 'debug-endpoint',
          status: 'NEW',
          isSpam: false,
          formData: { debug: true, createdAt: new Date().toISOString() },
        },
      })
      return NextResponse.json({
        success: true,
        message: 'Test lead created',
        lead: testLead,
      })
    }

    // Default: Show recent leads
    const leads = await prisma.leads.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        source: true,
        status: true,
        isSpam: true,
        createdAt: true,
      },
    })

    const totalCount = await prisma.leads.count()

    return NextResponse.json({
      success: true,
      totalCount,
      recentLeads: leads,
      message: leads.length === 0 ? 'No leads in database' : `Found ${leads.length} recent leads`,
    })
  } catch (error) {
    console.error('[Debug Leads] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// Test POST to simulate form submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Create lead from POST data
    const lead = await prisma.leads.create({
      data: {
        email: body.email || `test-${Date.now()}@debug.local`,
        name: body.name || 'Debug POST Test',
        source: body.source || 'debug-post',
        status: 'NEW',
        isSpam: false,
        formData: body,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Lead created via POST',
      lead,
    })
  } catch (error) {
    console.error('[Debug Leads POST] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
