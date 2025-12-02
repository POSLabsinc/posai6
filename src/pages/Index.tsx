import Header from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-6">
        <h1 className="text-2xl font-bold">Welcome to Your App</h1>
        <p className="text-muted-foreground mt-2">Start building your amazing project here!</p>
      </main>
    </div>
  );
};

export default Index;
