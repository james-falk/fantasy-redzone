import { Course as CourseType } from '@/types/content'
import { getStaticCourses, getContentBySlug } from './content'

// Legacy interface for backward compatibility
export interface Course {
  title: string
  shortDescription: string
  cover: string
  slug: string
  category: string
  publishDate: string
  duration: string
  features: string[]
}

// Function to get all courses (legacy support)
export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const courses = await getStaticCourses()
    
    // Convert to legacy format
    return courses.map(course => ({
      title: course.title,
      shortDescription: course.shortDescription,
      cover: course.cover,
      slug: course.slug,
      category: course.category,
      publishDate: course.publishDate,
      duration: course.duration,
      features: course.features
    }))
  } catch (error: unknown) {
    console.error('Error:', error)
    return []
  }
}

// Function to get a single course by its slug (legacy support)
export const getOneCourse = async (slug: string): Promise<Course | null> => {
  try {
    const content = await getContentBySlug(slug)
    
    if (!content || content.source !== 'static') {
      return null
    }
    
         const course = content as CourseType
    
    // Convert to legacy format
    return {
      title: course.title,
      shortDescription: course.shortDescription,
      cover: course.cover,
      slug: course.slug,
      category: course.category,
      publishDate: course.publishDate,
      duration: course.duration,
      features: course.features
    }
  } catch (error: unknown) {
    console.error('Error:', error)
    return null
  }
}
