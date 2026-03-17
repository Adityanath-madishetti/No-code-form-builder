/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button } from "@/components/ui/button"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"



import { createDummyComponent } from "@/form/components/Dummy";
import { createTextBoxComponent } from "@/form/components/TextBox";
import { deserializeComponent } from "@/form/registry/componentRegistry";
import type { ComponentID } from "@/form/components/Base";
import { RenderComponent } from "../form/renderer/viewRenderer/RenderComponent";

// Direct creation
const dummy = createDummyComponent(
  "instance-1",
  { label: "Hello World", description: "This is a dummy component." },
  { text: "This is a dummy component." }
);

// From deserialization
const json = {
  id: "Dummy" as ComponentID,
  instanceId: "instance-1",
  name: "DummyComponent",
  metadata: { label: "Hello World", description: "This is a dummy component." },
  props: { text: "This is a dummy component." },
};
const component = deserializeComponent(json);

// Another component
const textBox = createTextBoxComponent(
  "instance-2",
  { label: "Static Text", description: "This is a static text box." },
  { text: "This is a static text box. Yeah.Yeah.Yeah.Yeah.Yeah.Yeah." }
);


import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";




export function Home() {

  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };


  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="mt-2" >Show Dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>

        <Button variant="outline" className="mt-2" onClick={handleLogout}>
          Logout
        </Button>

        {/* <RenderComponent component={dummy} />
        <RenderComponent component={component} />

        <RenderComponent component={textBox} /> */}

      </div>
    </div>
  )
}

export default Home