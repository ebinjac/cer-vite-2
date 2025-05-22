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
import type { TeamManagement, TeamManagementInput } from '@/hooks/use-team-management'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const formSchema = z.object({
  teamName: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }).max(50, {
    message: "Team name cannot exceed 50 characters."
  }).regex(/^[a-zA-Z0-9\s-_]+$/, {
    message: "Team name can only contain letters, numbers, spaces, hyphens, and underscores."
  }),
  escalation: z.string().email({
    message: "Please enter a valid email address.",
  }),
  alert1: z.array(z.object({
    id: z.string(),
    text: z.string().email("Please enter valid email addresses")
  })).min(1, {
    message: "At least one email address is required for Alert Level 1."
  }),
  alert2: z.array(z.object({
    id: z.string(),
    text: z.string().email("Please enter valid email addresses")
  })).min(1, {
    message: "At least one email address is required for Alert Level 2."
  }),
  alert3: z.array(z.object({
    id: z.string(),
    text: z.string().email("Please enter valid email addresses")
  })).min(1, {
    message: "At least one email address is required for Alert Level 3."
  }),
  snowGroup: z.string().min(2, {
    message: "Snow group must be at least 2 characters.",
  }).max(50, {
    message: "Snow group cannot exceed 50 characters."
  }).regex(/^[a-zA-Z0-9\s-_]+$/, {
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
  }).regex(/^[a-zA-Z0-9\s-_]+$/, {
    message: "PRC group can only contain letters, numbers, spaces, hyphens, and underscores."
  }),
})

interface TeamFormProps {
  initialData?: TeamManagement
  onSubmit: (data: TeamManagementInput) => void
  isSubmitting?: boolean
  formRef?: React.RefObject<HTMLFormElement>
  hideSubmitButton?: boolean
}

export function TeamForm({ initialData, onSubmit, isSubmitting, formRef, hideSubmitButton }: TeamFormProps) {
  // State for active tag indices
  const [activeAppTagIndex, setActiveAppTagIndex] = React.useState<number | null>(-1)
  const [activeAlert1TagIndex, setActiveAlert1TagIndex] = React.useState<number | null>(-1)
  const [activeAlert2TagIndex, setActiveAlert2TagIndex] = React.useState<number | null>(-1)
  const [activeAlert3TagIndex, setActiveAlert3TagIndex] = React.useState<number | null>(-1)

  // Convert string lists to tag arrays
  const convertToTags = (str: string = ''): Tag[] => {
    return str.split(',')
      .map(item => item.trim())
      .filter(Boolean)
      .map(text => ({
        id: crypto.randomUUID(),
        text
      }))
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: initialData?.teamName || "",
      escalation: initialData?.escalation || "",
      alert1: convertToTags(initialData?.alert1),
      alert2: convertToTags(initialData?.alert2),
      alert3: convertToTags(initialData?.alert3),
      snowGroup: initialData?.snowGroup || "",
      functionHandled: initialData?.functionHandled || "certificate",
      applications: convertToTags(initialData?.listOfApplicationNames),
      prcGroup: initialData?.prcGroup || "",
    },
  })

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    // Convert tag arrays back to comma-separated strings
    const convertedData = {
      ...data,
      alert1: data.alert1.map(tag => tag.text).join(', '),
      alert2: data.alert2.map(tag => tag.text).join(', '),
      alert3: data.alert3.map(tag => tag.text).join(', '),
      listOfApplicationNames: data.applications.map(tag => tag.text).join(', '),
    }
    onSubmit(convertedData)
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
      <form 
        ref={formRef as React.RefObject<HTMLFormElement>} 
        onSubmit={form.handleSubmit(handleSubmit)} 
        className="space-y-2"
      >
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
              <div className="grid grid-cols-1 gap-2">
                <FormField
                  control={form.control}
                  name="escalation"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm font-medium">Escalation Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          className="h-8 border-2 focus-visible:ring-2" 
                          placeholder="Enter escalation email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
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
            <Button type="submit" disabled={isSubmitting} className="h-8 text-sm">
              {isSubmitting ? "Saving..." : "Save Team"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
} 