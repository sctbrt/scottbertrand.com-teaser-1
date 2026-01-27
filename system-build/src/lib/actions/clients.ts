'use server'

// Server Actions for Client Management
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type ClientActionState = {
  error?: string
  success?: boolean
} | null

export async function createClient(
  prevState: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'INTERNAL_ADMIN') {
    return { error: 'Unauthorized' }
  }

  const contactName = formData.get('contactName') as string
  const contactEmail = formData.get('contactEmail') as string
  const companyName = formData.get('companyName') as string | null
  const phone = formData.get('phone') as string | null
  const website = formData.get('website') as string | null
  const notes = formData.get('notes') as string | null

  if (!contactName || !contactEmail) {
    return { error: 'Contact name and email are required' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(contactEmail)) {
    return { error: 'Invalid email format' }
  }

  // Check if user with this email already exists
  const existingUser = await prisma.users.findUnique({
    where: { email: contactEmail.toLowerCase() },
  })

  if (existingUser) {
    // Check if they already have a client profile
    const existingClient = await prisma.clients.findUnique({
      where: { userId: existingUser.id },
    })

    if (existingClient) {
      return { error: 'A client with this email already exists' }
    }
  }

  let clientId: string

  try {
    if (existingUser) {
      // Create client profile for existing user
      const client = await prisma.clients.create({
        data: {
          userId: existingUser.id,
          contactName,
          contactEmail: contactEmail.toLowerCase(),
          companyName: companyName || null,
          phone: phone || null,
          website: website || null,
          notes: notes || null,
        },
      })

      // Update user role to CLIENT if not admin
      if (existingUser.role !== 'INTERNAL_ADMIN') {
        await prisma.users.update({
          where: { id: existingUser.id },
          data: { role: 'CLIENT' },
        })
      }

      clientId = client.id
    } else {
      // Create new user and client
      const user = await prisma.users.create({
        data: {
          email: contactEmail.toLowerCase(),
          name: contactName,
          role: 'CLIENT',
        },
      })

      const client = await prisma.clients.create({
        data: {
          userId: user.id,
          contactName,
          contactEmail: contactEmail.toLowerCase(),
          companyName: companyName || null,
          phone: phone || null,
          website: website || null,
          notes: notes || null,
        },
      })

      // Log activity
      await prisma.activity_logs.create({
        data: {
          userId: session.user.id,
          action: 'CREATE',
          entityType: 'Client',
          entityId: client.id,
          details: { contactName, contactEmail },
        },
      })

      clientId = client.id
    }
  } catch (error) {
    console.error('Error creating client:', error)
    return { error: 'Failed to create client' }
  }

  revalidatePath('/dashboard/clients')
  redirect(`/dashboard/clients/${clientId}`)
}

export async function updateClient(
  clientId: string,
  prevState: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'INTERNAL_ADMIN') {
    return { error: 'Unauthorized' }
  }

  const contactName = formData.get('contactName') as string
  const contactEmail = formData.get('contactEmail') as string
  const companyName = formData.get('companyName') as string | null
  const phone = formData.get('phone') as string | null
  const website = formData.get('website') as string | null
  const notes = formData.get('notes') as string | null

  if (!contactName || !contactEmail) {
    return { error: 'Contact name and email are required' }
  }

  try {
    const client = await prisma.clients.findUnique({
      where: { id: clientId },
      include: { users: true },
    })

    if (!client) {
      return { error: 'Client not found' }
    }

    // Check if email is being changed and if new email is already in use
    if (contactEmail.toLowerCase() !== client.contactEmail.toLowerCase()) {
      const existingUser = await prisma.users.findUnique({
        where: { email: contactEmail.toLowerCase() },
      })

      if (existingUser && existingUser.id !== client.userId) {
        return { error: 'This email is already in use by another account' }
      }

      // Update user email
      await prisma.users.update({
        where: { id: client.userId },
        data: { email: contactEmail.toLowerCase() },
      })
    }

    // Update client
    await prisma.clients.update({
      where: { id: clientId },
      data: {
        contactName,
        contactEmail: contactEmail.toLowerCase(),
        companyName: companyName || null,
        phone: phone || null,
        website: website || null,
        notes: notes || null,
      },
    })

    // Update user name
    await prisma.users.update({
      where: { id: client.userId },
      data: { name: contactName },
    })

    // Log activity
    await prisma.activity_logs.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'Client',
        entityId: clientId,
        details: { contactName, contactEmail },
      },
    })

    revalidatePath(`/dashboard/clients/${clientId}`)
    revalidatePath('/dashboard/clients')

    return { success: true }
  } catch (error) {
    console.error('Error updating clients:', error)
    return { error: 'Failed to update client' }
  }
}

export async function deleteClient(clientId: string): Promise<ClientActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'INTERNAL_ADMIN') {
    return { error: 'Unauthorized' }
  }

  const client = await prisma.clients.findUnique({
    where: { id: clientId },
    include: {
      _count: { select: { projects: true, invoices: true } },
    },
  })

  if (!client) {
    return { error: 'Client not found' }
  }

  // Prevent deletion if client has projects or invoices
  if (client._count.projects > 0 || client._count.invoices > 0) {
    return { error: 'Cannot delete client with existing projects or invoices' }
  }

  try {
    // Delete client (cascades to user due to relation)
    await prisma.clients.delete({
      where: { id: clientId },
    })

    // Delete user
    await prisma.users.delete({
      where: { id: client.userId },
    })

    // Log activity
    await prisma.activity_logs.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'Client',
        entityId: clientId,
      },
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return { error: 'Failed to delete client' }
  }

  revalidatePath('/dashboard/clients')
  redirect('/dashboard/clients')
}

export async function archiveMultipleClients(
  clientIds: string[]
): Promise<ClientActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'INTERNAL_ADMIN') {
    return { error: 'Unauthorized' }
  }

  if (!clientIds || clientIds.length === 0) {
    return { error: 'No clients selected' }
  }

  try {
    await prisma.clients.updateMany({
      where: { id: { in: clientIds } },
      data: { isArchived: true },
    })

    // Log activity
    await prisma.activity_logs.create({
      data: {
        userId: session.user.id,
        action: 'BULK_ARCHIVE',
        entityType: 'Client',
        entityId: 'multiple',
        details: { count: clientIds.length, clientIds },
      },
    })
  } catch (error) {
    console.error('Error archiving clients:', error)
    return { error: 'Failed to archive clients' }
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}

export async function unarchiveClient(clientId: string): Promise<ClientActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'INTERNAL_ADMIN') {
    return { error: 'Unauthorized' }
  }

  try {
    await prisma.clients.update({
      where: { id: clientId },
      data: { isArchived: false },
    })

    await prisma.activity_logs.create({
      data: {
        userId: session.user.id,
        action: 'UNARCHIVE',
        entityType: 'Client',
        entityId: clientId,
      },
    })
  } catch (error) {
    console.error('Error unarchiving client:', error)
    return { error: 'Failed to unarchive client' }
  }

  revalidatePath('/dashboard/clients')
  revalidatePath(`/dashboard/clients/${clientId}`)
  return { success: true }
}

export async function deleteMultipleClients(
  clientIds: string[]
): Promise<ClientActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'INTERNAL_ADMIN') {
    return { error: 'Unauthorized' }
  }

  if (!clientIds || clientIds.length === 0) {
    return { error: 'No clients selected' }
  }

  // Check for clients with projects or invoices
  const clients = await prisma.clients.findMany({
    where: { id: { in: clientIds } },
    include: {
      _count: { select: { projects: true, invoices: true } },
    },
  })

  const clientsWithData = clients.filter(
    (c) => c._count.projects > 0 || c._count.invoices > 0
  )

  if (clientsWithData.length > 0) {
    return {
      error: `Cannot delete ${clientsWithData.length} client(s) with existing projects or invoices. Archive them instead.`,
    }
  }

  try {
    // Get user IDs for deletion
    const userIds = clients.map((c) => c.userId)

    // Delete clients
    await prisma.clients.deleteMany({
      where: { id: { in: clientIds } },
    })

    // Delete associated users
    await prisma.users.deleteMany({
      where: { id: { in: userIds } },
    })

    // Log activity
    await prisma.activity_logs.create({
      data: {
        userId: session.user.id,
        action: 'BULK_DELETE',
        entityType: 'Client',
        entityId: 'multiple',
        details: { count: clientIds.length, clientIds },
      },
    })
  } catch (error) {
    console.error('Error deleting clients:', error)
    return { error: 'Failed to delete clients' }
  }

  revalidatePath('/dashboard/clients')
  return { success: true }
}
