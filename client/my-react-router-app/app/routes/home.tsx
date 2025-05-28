import type { Route } from "./+types/home";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "@radix-ui/react-label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { ScrollArea } from "~/components/ui/scroll-area";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <div className="flex flex-col p-4 gap-4">
      <h1 className="text-2xl text-center">Meter Readings</h1>
      <UploadMeterReadings />
      <Meters />
      <Accounts />
    </div>);
}

function UploadMeterReadings() {

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget)
    console.log(formData)
    fetch("http://localhost:5222/meter-reading-uploads", {
      method: "POST",
      body: formData,
    }).then(
      async (response) => { window.location.reload(); console.log(await response.json()) }
    ).catch((reason) => console.log(reason))
  }

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Upload your meter reading.</CardTitle>
        <CardDescription>Monitor energy consumption.</CardDescription>
      </CardHeader>
      <CardContent>
        <form method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="file">CSV File</Label>
              <Input id="file" name="file" accept=".csv" type="file" placeholder="Meter readings." />
            </div>
            <Button type="submit" variant="outline">Upload</Button>
          </div>
        </form>
      </CardContent>
    </Card>

  );
}

type Account = {
  accountId: number;
  firstName: string;
  lastName: string;
};

function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    fetch("http://localhost:5222/accounts", {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(async (response) => { setAccounts(await response.json()); }).catch((reason) => console.log(reason))
  }, [])

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>View account details.</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-56 w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>AccountId</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.accountId}>
                  <TableCell className="font-medium">{account.accountId}</TableCell>
                  <TableCell>{account.firstName}</TableCell>
                  <TableCell>{account.lastName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

type MeterReading = {
  id: number;
  accountId: number;
  meterReadingDateTime: string;
  meterReadValue: number;
};

function Meters() {
  const [readings, setReadings] = useState<MeterReading[]>([]);

  useEffect(() => {
    fetch("http://localhost:5222/meter-reading-uploads", {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(async (response) => { setReadings(await response.json()); }).catch((reason) => console.log(reason))
  }, [])

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>View meter readings.</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-56 w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>AccountId</TableHead>
                <TableHead>Meter Reading Date</TableHead>
                <TableHead>Meter Reading Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.map((reading) => (
                <TableRow key={reading.id}>
                  <TableCell className="font-medium">{reading.accountId}</TableCell>
                  <TableCell>{reading.meterReadingDateTime}</TableCell>
                  <TableCell>{reading.meterReadValue}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}


