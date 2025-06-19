"use client"

import * as React from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TagInput } from "emblor"
import type { Tag } from "emblor"
import type { TeamManagement } from '@/hooks/use-team-management'
import { useUpdateTeam } from '@/hooks/use-team-management'
import { toast } from "sonner"
import { Users, Settings, AppWindow, Contact, Bell, Loader2, Save, ShieldCheck, KeyRound } from "lucide-react"

const emailSchema = z.string().email("Please enter a valid email address.").regex(/@aexp\.com$/, {
  message: "Email must be an @aexp.com address."
})

const formSchema = z.object({
  teamName: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }).max(50, {
    message: "Team name cannot exceed 50 characters."
  }).regex(/^[a-zA-Z0-9\s_-]+$/, {
    message: "Team name can only contain letters, numbers, spaces, hyphens, and underscores."
  }),
  escalation: z.array(z.object({
    id: z.string(),
    text: emailSchema
  })).min(1, {
    message: "At least one escalation email address is required."
  }),
  alert1: z.array(z.object({
    id: z.string(),
    text: emailSchema
  })).min(1, {
    message: "At least one email address is required for Alert Level 1."
  }),
  alert2: z.array(z.object({
    id: z.string(),
    text: emailSchema
  })).min(1, {
    message: "At least one email address is required for Alert Level 2."
  }),
  alert3: z.array(z.object({
    id: z.string(),
    text: emailSchema
  })).min(1, {
    message: "At least one email address is required for Alert Level 3."
  }),
  snowGroup: z.string().min(2, {
    message: "Snow group must be at least 2 characters.",
  }).max(50, {
    message: "Snow group cannot exceed 50 characters."
  }).regex(/^[a-zA-Z0-9\s_-]+$/, {
    message: "Snow group can only contain letters, numbers, spaces, hyphens, and underscores."
  }),
  functionHandled: z.enum(['serviceid', 'certificate']),
  applications: z.array(z.object({
    id: z.string(),
    text: z.string().min(1, "Application name cannot be empty")
  })).min(1, {
    message: "At least one application is required."
  }),
  prcGroup: z.string().min(2, {
    message: "PRC group must be at least 2 characters.",
  }).max(50, {
    message: "PRC group cannot exceed 50 characters."
  }).regex(/^[a-zA-Z0-9\s_-]+$/, {
    message: "PRC group can only contain letters, numbers, spaces, hyphens, and underscores."
  }),
})

type FormValues = z.infer<typeof formSchema>

interface EditTeamFormProps {
  team: TeamManagement
  onSubmit: (data: TeamManagement) => void
  hideSubmitButton?: boolean
}

const convertToTags = (items: string[] = []): Tag[] => {
  return items.map(item => ({ id: crypto.randomUUID(), text: item }))
}

const convertStringToArray = (value: string | undefined | string[]): string[] => {
  if (Array.isArray(value)) return value
  if (!value) return []
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

const validateEmail = (tag: { text: string }): boolean => {
  try {
    emailSchema.parse(tag.text)
    return true
  } catch {
    return false
  }
}

export function EditTeamForm({ team, onSubmit, hideSubmitButton }: EditTeamFormProps) {
  const [activeAppTagIndex, setActiveAppTagIndex] = React.useState<number | null>(-1)
  const [activeEscalationTagIndex, setActiveEscalationTagIndex] = React.useState<number | null>(-1)
  const [activeAlert1TagIndex, setActiveAlert1TagIndex] = React.useState<number | null>(-1)
  const [activeAlert2TagIndex, setActiveAlert2TagIndex] = React.useState<number | null>(-1)
  const [activeAlert3TagIndex, setActiveAlert3TagIndex] = React.useState<number | null>(-1)

  const { mutateAsync: updateTeam, isPending: isUpdating } = useUpdateTeam()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: team.teamName,
      escalation: convertToTags(convertStringToArray(team.escalation)),
      alert1: convertToTags(convertStringToArray(team.alert1)),
      alert2: convertToTags(convertStringToArray(team.alert2)),
      alert3: convertToTags(convertStringToArray(team.alert3)),
      snowGroup: team.snowGroup,
      functionHandled: team.functionHandled,
      applications: convertToTags(convertStringToArray(team.listOfApplicationNames)),
      prcGroup: team.prcGroup,
    },
  })

  const handleSubmit = async (data: FormValues) => {
    try {
      console.log('Edit Form - Original Team:', team)
      
      const updateData: TeamManagement = {
        id: team.id,
        teamName: data.teamName,
        escalation: data.escalation.map(a => a.text).join(","),
        alert1: data.alert1.map(a => a.text).join(","),
        alert2: data.alert2.map(a => a.text).join(","),
        alert3: data.alert3.map(a => a.text).join(","),
        snowGroup: data.snowGroup,
        functionHandled: data.functionHandled,
        listOfApplicationNames: data.applications.map(a => a.text).join(","),
        prcGroup: data.prcGroup,
      }

      console.log('Edit Form - Update Data (with ID):', updateData)
      await updateTeam(updateData)
      toast.success("Team Updated", {
        description: "The team has been updated successfully."
      })
      
      onSubmit(updateData)
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "An error occurred while saving the team."
      })
    }
  }

  // Common TagInput styles
  const tagInputStyles = {
    tagList: {
      container: "gap-1.5",
    },
    input: "rounded-md border-input bg-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/70",
    tag: {
      body: "relative h-7 bg-muted/50 hover:bg-muted border border-input rounded-md font-medium text-xs ps-2 pe-7 transition-colors",
      closeButton: "absolute -inset-y-px -end-px p-0 rounded-s-none rounded-e-md flex size-7 items-center justify-center transition-colors outline-none text-muted-foreground/80 hover:text-foreground hover:bg-muted/80",
    },
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="space-y-2 mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <Users className="h-6 w-6" />
          Edit Team
        </h2>
        <p className="text-sm text-muted-foreground">
          Update team settings and configuration
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold text-primary">
              <Settings className="h-4 w-4" />
              Basic Information
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
              <FormField
                control={form.control}
                name="teamName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">Team Name</FormLabel>
                    <FormControl>
                      <Input 
                        className="bg-background" 
                        placeholder="Enter team name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="functionHandled"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">Function Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select function type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="certificate">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                            Certificate
                          </div>
                        </SelectItem>
                        <SelectItem value="serviceid">
                          <div className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-blue-500" />
                            Service ID
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Applications Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold text-primary">
              <AppWindow className="h-4 w-4" />
              Applications
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <FormField
                control={form.control}
                name="applications"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">Managed Applications</FormLabel>
                    <FormControl>
                      <TagInput
                        id="applications"
                        tags={field.value}
                        setTags={field.onChange}
                        placeholder="Type application name and press Enter"
                        styleClasses={{
                          ...tagInputStyles,
                          input: tagInputStyles.input + " bg-background",
                        }}
                        inlineTags={false}
                        inputFieldPosition="top"
                        activeTagIndex={activeAppTagIndex}
                        setActiveTagIndex={setActiveAppTagIndex}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Add all applications that this team will manage
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold text-primary">
              <Contact className="h-4 w-4" />
              Contact Information
            </div>

            <div className="grid gap-4 bg-muted/50 rounded-lg p-4">
              <FormField
                control={form.control}
                name="escalation"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">Escalation Emails</FormLabel>
                    <FormControl>
                      <TagInput
                        tags={field.value}
                        setTags={field.onChange}
                        placeholder="Enter @aexp.com email and press Enter"
                        activeTagIndex={activeEscalationTagIndex}
                        setActiveTagIndex={setActiveEscalationTagIndex}
                        validate={validateEmail}
                        styleClasses={{
                          ...tagInputStyles,
                          input: tagInputStyles.input + " bg-background",
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Add @aexp.com email addresses for escalation notifications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="snowGroup"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium">Snow Group</FormLabel>
                      <FormControl>
                        <Input 
                          className="bg-background" 
                          placeholder="Enter snow group"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prcGroup"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium">PRC Group</FormLabel>
                      <FormControl>
                        <Input 
                          className="bg-background" 
                          placeholder="Enter PRC group"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Alert Configuration Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold text-primary">
              <Bell className="h-4 w-4" />
              Alert Configuration
            </div>

            <div className="grid gap-4 bg-muted/50 rounded-lg p-4">
              <FormField
                control={form.control}
                name="alert1"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        Alert Level 1
                      </div>
                    </FormLabel>
                    <FormControl>
                      <TagInput
                        id="alert1"
                        tags={field.value}
                        setTags={field.onChange}
                        placeholder="Type email and press Enter"
                        styleClasses={{
                          ...tagInputStyles,
                          input: tagInputStyles.input + " bg-background",
                        }}
                        inlineTags={false}
                        inputFieldPosition="top"
                        activeTagIndex={activeAlert1TagIndex}
                        setActiveTagIndex={setActiveAlert1TagIndex}
                        validate={validateEmail}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Enter email addresses for initial alerts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alert2"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        Alert Level 2
                      </div>
                    </FormLabel>
                    <FormControl>
                      <TagInput
                        id="alert2"
                        tags={field.value}
                        setTags={field.onChange}
                        placeholder="Type email and press Enter"
                        styleClasses={{
                          ...tagInputStyles,
                          input: tagInputStyles.input + " bg-background",
                        }}
                        inlineTags={false}
                        inputFieldPosition="top"
                        activeTagIndex={activeAlert2TagIndex}
                        setActiveTagIndex={setActiveAlert2TagIndex}
                        validate={validateEmail}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Enter email addresses for intermediate alerts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alert3"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Alert Level 3
                      </div>
                    </FormLabel>
                    <FormControl>
                      <TagInput
                        id="alert3"
                        tags={field.value}
                        setTags={field.onChange}
                        placeholder="Type email and press Enter"
                        styleClasses={{
                          ...tagInputStyles,
                          input: tagInputStyles.input + " bg-background",
                        }}
                        inlineTags={false}
                        inputFieldPosition="top"
                        activeTagIndex={activeAlert3TagIndex}
                        setActiveTagIndex={setActiveAlert3TagIndex}
                        validate={validateEmail}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Enter email addresses for critical alerts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {!hideSubmitButton && (
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background py-3 border-t">
              <Button 
                type="submit" 
                disabled={isUpdating}
                className="min-w-[140px]"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Team
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
} 