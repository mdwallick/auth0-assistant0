
'use client';

import { useEffect, useState } from 'react';
import { auth0 } from '@/lib/auth0';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ServiceAuthPanel } from '@/components/ServiceAuthPanel';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const session = await auth0.getSession();
      setUser(session?.user);
      setEditedUser(session?.user);
    };
    fetchUser();
  }, []);

  if (!user) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="p-6 border rounded-lg space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm">Name</label>
                  <Input 
                    value={editedUser.name}
                    onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Email</label>
                  <Input value={user.email} disabled />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(false)}>Save</Button>
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false);
                    setEditedUser(user);
                  }}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-[100px,1fr] gap-2">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{user.name}</span>
                </div>
                <div className="grid grid-cols-[100px,1fr] gap-2">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{user.email}</span>
                </div>
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              </>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Connected Services</h2>
          <ServiceAuthPanel />
        </div>
      </div>
    </div>
  );
}
