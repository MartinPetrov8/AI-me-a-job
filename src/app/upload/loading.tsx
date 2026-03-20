export default function UploadLoading() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
          <div className="h-6 w-96 bg-gray-200 rounded animate-pulse mx-auto" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 border-2 border-dashed border-gray-300">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto" />
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mx-auto" />
            <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse mx-auto mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
