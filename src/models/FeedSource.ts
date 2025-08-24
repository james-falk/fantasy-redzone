import mongoose, { Schema, Document } from "mongoose"

export interface IFeedSource extends Document {
  type: "youtube" | "rss"
  identifier: string // Channel ID for YouTube or RSS feed URL for RSS
  name: string // Human-friendly display name
  enabled: boolean
  description?: string
  category?: string
  maxResults?: number // For YouTube channels
  lastIngested?: Date
  errorCount: number
  lastError?: string
  createdAt: Date
  updatedAt: Date
}

const FeedSourceSchema: Schema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["youtube", "rss"],
      index: true
    },
    identifier: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      trim: true,
      index: true
    },
    maxResults: {
      type: Number,
      default: 25,
      min: 1,
      max: 100
    },
    lastIngested: {
      type: Date
    },
    errorCount: {
      type: Number,
      default: 0
    },
    lastError: {
      type: String
    }
  },
  { timestamps: true }
)

// Compound index for efficient querying
FeedSourceSchema.index({ type: 1, enabled: 1 })
FeedSourceSchema.index({ category: 1, enabled: 1 })

// Validation for identifier format based on type
FeedSourceSchema.pre("save", function(next) {
  if (this.type === "youtube") {
    // YouTube channel ID format validation (starts with UC)
    if (!(this.identifier as string).startsWith("UC")) {
      return next(new Error("YouTube channel ID must start with 'UC'"))
    }
  } else if (this.type === "rss") {
    // Basic URL validation for RSS feeds
    try {
      new URL(this.identifier as string)
    } catch {
      return next(new Error("RSS identifier must be a valid URL"))
    }
  }
  next()
})

// Method to update ingestion status
FeedSourceSchema.methods.updateIngestionStatus = function(success: boolean, error?: string) {
  if (success) {
    this.lastIngested = new Date()
    this.errorCount = 0
    this.lastError = undefined
  } else {
    this.errorCount += 1
    this.lastError = error
  }
  return this.save()
}

// Static method to get enabled sources by type
FeedSourceSchema.statics.getEnabledSources = function(type?: "youtube" | "rss") {
  const query: Record<string, unknown> = { enabled: true }
  if (type) {
    query.type = type
  }
  return this.find(query).sort({ name: 1 })
}

// Static method to get sources by category
FeedSourceSchema.statics.getSourcesByCategory = function(category: string) {
  return this.find({ enabled: true, category }).sort({ name: 1 })
}

export default mongoose.models.FeedSource || mongoose.model<IFeedSource>("FeedSource", FeedSourceSchema)
