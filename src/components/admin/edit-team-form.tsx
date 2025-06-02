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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

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
      // Debug log for incoming team data
      console.log('Edit Form - Original Team:', team)
      
      // Construct update data with ID
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
      
      // Call parent onSubmit callback
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
      container: "gap-1",
    },
    input: "rounded-md transition-[color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-ring outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
    tag: {
      body: "relative h-7 bg-background border border-input hover:bg-background rounded-md font-medium text-xs ps-2 pe-7 transition-colors hover:border-ring",
      closeButton: "absolute -inset-y-px -end-px p-0 rounded-s-none rounded-e-md flex size-7 transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-muted-foreground/80 hover:text-foreground",
    },
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Information Section */}
          <Card className="border-none shadow-none">
            <CardHeader className="px-0 pt-0 pb-1.5">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-2">
              <FormField
                control={form.control}
                name="teamName"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium">Team Name</FormLabel>
                    <FormControl>
                      <Input 
                        className="h-8 border-2 focus-visible:ring-2" 
                        placeholder="Enter team name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="functionHandled"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium">Function</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 border-2 focus-visible:ring-2">
                          <SelectValue placeholder="Select function" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="certificate">Certificate</SelectItem>
                        <SelectItem value="serviceid">Service ID</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information Section */}
          <Card className="border-none shadow-none">
            <CardHeader className="px-0 pt-0 pb-1.5">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-2">
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="escalation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escalation Emails</FormLabel>
                      <FormControl>
                        <TagInput
                          tags={field.value}
                          setTags={field.onChange}
                          placeholder="Enter @aexp.com email and press Enter"
                          activeTagIndex={activeEscalationTagIndex}
                          setActiveTagIndex={setActiveEscalationTagIndex}
                          validate={validateEmail}
                          styleClasses={tagInputStyles}
                        />
                      </FormControl>
                      <FormDescription>
                        Add @aexp.com email addresses for escalation notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="snowGroup"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm font-medium">Snow Group</FormLabel>
                      <FormControl>
                        <Input 
                          className="h-8 border-2 focus-visible:ring-2" 
                          placeholder="Enter snow group" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prcGroup"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm font-medium">PRC Group</FormLabel>
                      <FormControl>
                        <Input 
                          className="h-8 border-2 focus-visible:ring-2" 
                          placeholder="Enter PRC group" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications & Alerts Section */}
        <Card className="border-none shadow-none">
          <CardHeader className="px-0 pt-2 pb-1.5">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Applications & Alerts</CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-2">
            <FormField
              control={form.control}
              name="applications"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-medium">Applications</FormLabel>
                  <FormControl>
                    <TagInput
                      id="applications"
                      tags={field.value}
                      setTags={field.onChange}
                      placeholder="Type application name and press Enter"
                      styleClasses={{
                        ...tagInputStyles,
                        input: tagInputStyles.input + " h-8 border-2 focus-visible:ring-2",
                        tagList: {
                          container: "gap-1",
                        },
                      }}
                      inlineTags={false}
                      inputFieldPosition="top"
                      activeTagIndex={activeAppTagIndex}
                      setActiveTagIndex={setActiveAppTagIndex}
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    Type each application name and press Enter
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="alert1"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium">Alert Level 1</FormLabel>
                    <FormControl>
                      <TagInput
                        id="alert1"
                        tags={field.value}
                        setTags={field.onChange}
                        placeholder="Type email and press Enter"
                        styleClasses={{
                          ...tagInputStyles,
                          input: tagInputStyles.input + " h-8 border-2 focus-visible:ring-2",
                          tagList: {
                            container: "gap-1",
                          },
                        }}
                        inlineTags={false}
                        inputFieldPosition="top"
                        activeTagIndex={activeAlert1TagIndex}
                        setActiveTagIndex={setActiveAlert1TagIndex}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Enter email addresses for Alert Level 1
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alert2"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium">Alert Level 2</FormLabel>
                    <FormControl>
                      <TagInput
                        id="alert2"
                        tags={field.value}
                        setTags={field.onChange}
                        placeholder="Type email and press Enter"
                        styleClasses={{
                          ...tagInputStyles,
                          input: tagInputStyles.input + " h-8 border-2 focus-visible:ring-2",
                          tagList: {
                            container: "gap-1",
                          },
                        }}
                        inlineTags={false}
                        inputFieldPosition="top"
                        activeTagIndex={activeAlert2TagIndex}
                        setActiveTagIndex={setActiveAlert2TagIndex}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Enter email addresses for Alert Level 2
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alert3"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium">Alert Level 3</FormLabel>
                    <FormControl>
                      <TagInput
                        id="alert3"
                        tags={field.value}
                        setTags={field.onChange}
                        placeholder="Type email and press Enter"
                        styleClasses={{
                          ...tagInputStyles,
                          input: tagInputStyles.input + " h-8 border-2 focus-visible:ring-2",
                          tagList: {
                            container: "gap-1",
                          },
                        }}
                        inlineTags={false}
                        inputFieldPosition="top"
                        activeTagIndex={activeAlert3TagIndex}
                        setActiveTagIndex={setActiveAlert3TagIndex}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Enter email addresses for Alert Level 3
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {!hideSubmitButton && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isUpdating} className="h-8 text-sm">
              {isUpdating ? "Saving..." : "Update Team"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
} 