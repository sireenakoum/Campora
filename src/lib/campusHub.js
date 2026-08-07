import { supabase } from './supabase'

export async function getAnnouncements({ category = null, search = null } = {}) {
  let query = supabase
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getCampusNews({ search = null, tag = null } = {}) {
  let query = supabase
    .from('campus_news')
    .select('*')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (tag) {
    query = query.contains('tags', [tag])
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getEvents({ category = null, search = null, upcoming = false } = {}) {
  let query = supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: true })

  if (category) {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (upcoming) {
    query = query.gte('start_date', new Date().toISOString())
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getResources({ category = null, type = null, search = null } = {}) {
  let query = supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  if (type) {
    query = query.eq('type', type)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getAnnouncementById(id) {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getEventById(id) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getNewsById(id) {
  const { data, error } = await supabase
    .from('campus_news')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getPinnedAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_pinned', true)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) throw error
  return data
}

export async function getUpcomingEvents(days = 30) {
  const now = new Date().toISOString()
  const future = new Date()
  future.setDate(future.getDate() + days)
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('start_date', now)
    .lte('start_date', future.toISOString())
    .order('start_date', { ascending: true })

  if (error) throw error
  return data
}

export async function getAnnouncementCategories() {
  const { data, error } = await supabase
    .from('announcements')
    .select('category')
    .not('category', 'is', null)
    .order('category')

  if (error) throw error
  const categories = [...new Set(data.map(item => item.category))]
  return categories
}

export async function getNewsTags() {
  const { data, error } = await supabase
    .from('campus_news')
    .select('tags')
    .not('tags', 'is', null)

  if (error) throw error
  const allTags = data.flatMap(item => item.tags || [])
  const uniqueTags = [...new Set(allTags)]
  return uniqueTags
}

export async function getFeaturedResources() {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(4)

  if (error) throw error
  return data
}

export default {
  getAnnouncements,
  getAnnouncementById,
  getCampusNews,
  getNewsById,
  getEvents,
  getEventById,
  getResources,
  getPinnedAnnouncements,
  getUpcomingEvents,
  getAnnouncementCategories,
  getNewsTags,
  getFeaturedResources
}