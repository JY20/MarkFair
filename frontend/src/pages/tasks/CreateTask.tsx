import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DollarSign,
  Calendar,
  Target,
  AlertCircle,
  Wallet,
  Plus,
  X,
  Youtube,
  Users,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useAccount } from "@starknet-react/core";
import {
  MARKFAIR_TOKEN_ABI,
  KOL_ABI,
  MARKFAIR_TOKEN_ADDRESS,
  KOL_ADDRESS,
} from "../../constants";
import { TokenContract } from "../../helpers/TokenContract";
import { UserContract } from "../../helpers/UserContract";

const createTaskSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  platform: z.enum(["youtube"]),
  budget: z.number().min(100, "Minimum budget is $100"),
  deadline: z.string().min(1, "Deadline is required"),
  requirements: z
    .array(z.string())
    .min(1, "At least one requirement is needed"),
  minSubscribers: z.number().min(0, "Minimum subscribers must be 0 or more"),
  minLikes: z.number().min(0, "Minimum likes must be 0 or more"),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

export function CreateTask() {
  const { wallet } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRequirement, setNewRequirement] = useState("");
  const { address, account, isConnected, isDisconnected } = useAccount();
  const contract = new TokenContract();
  const userContract = new UserContract();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      platform: "youtube",
      requirements: [],
      minSubscribers: 1000,
      minLikes: 100,
    },
  });

  const requirements = watch("requirements") || [];

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setValue("requirements", [...requirements, newRequirement.trim()]);
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setValue(
      "requirements",
      requirements.filter((_, i) => i !== index)
    );
  };

  const onSubmit = async (data: CreateTaskForm) => {
    if (!wallet?.connected) {
      alert("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock wallet transaction
      console.log("Processing payment...", data.budget);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock API call to create task
      console.log("Creating task:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert("Task created successfully!");

      // Reset form or redirect
      window.location.href = "/tasks/my-tasks";
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async () => {
    console.log("wallet", wallet);
    console.log(address);
    if (isDisconnected) {
      console.log("isDisconnected");
      return;
    }
    if (isConnected) {
      const balance = await contract.getWalletBalance(address);
      console.log(balance);
      // const approve = await contract.Approve(KOL_ADDRESS, 3, account);
      // console.log(approve);
      const status = await userContract.getPool('0x2001');
      console.log(status);
    }
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Create New Task
          </h1>
          <p className="text-gray-400">
            Set up your advertising campaign and connect with KOLs
          </p>
        </div>

        {/* Wallet Connection Warning */}
        {!wallet?.connected && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div className="flex-1">
                <p className="text-yellow-400 font-medium">
                  Wallet Not Connected
                </p>
                <p className="text-yellow-300/80 text-sm">
                  You need to connect your wallet to create and fund tasks
                </p>
              </div>
              <button
                onClick={() => {
                  // This will be handled by the wallet connector modal
                  alert(
                    "Please use the wallet connection button in the header"
                  );
                }}
                className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors flex items-center space-x-2"
              >
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Basic Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Task Title *
                    </label>
                    <input
                      {...register("title")}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="e.g., Tech Product Review Campaign"
                    />
                    {errors.title && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      {...register("description")}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Describe your campaign objectives, target audience, and expectations..."
                    />
                    {errors.description && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Platform *
                    </label>
                    <div className="relative">
                      <select
                        {...register("platform")}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white appearance-none"
                      >
                        <option value="youtube">YouTube</option>
                      </select>
                      <Youtube className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget & Timeline */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 text-primary-400 mr-2" />
                  Budget & Timeline
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Budget (USD) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...register("budget", { valueAsNumber: true })}
                        type="number"
                        min="100"
                        step="50"
                        className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-white placeholder-gray-400 transition-all"
                        placeholder="1000"
                      />
                    </div>
                    {errors.budget && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.budget.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Deadline *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        {...register("deadline")}
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-white transition-all"
                      />
                    </div>
                    {errors.deadline && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.deadline.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Target className="h-5 w-5 text-primary-400 mr-2" />
                  Requirements
                </h2>
                <div className="space-y-6">
                  {/* YouTube Metrics */}
                  <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                      <Youtube className="h-5 w-5 text-red-500 mr-2" />
                      YouTube Metrics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Minimum Subscribers
                        </label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            {...register("minSubscribers", {
                              valueAsNumber: true,
                            })}
                            type="number"
                            min="0"
                            step="100"
                            className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-white placeholder-gray-400 transition-all"
                            placeholder="1000"
                          />
                        </div>
                        {errors.minSubscribers && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.minSubscribers.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Minimum Likes per Video
                        </label>
                        <div className="relative">
                          <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            {...register("minLikes", { valueAsNumber: true })}
                            type="number"
                            min="0"
                            step="10"
                            className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-white placeholder-gray-400 transition-all"
                            placeholder="100"
                          />
                        </div>
                        {errors.minLikes && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.minLikes.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Requirements */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">
                      Additional Requirements
                    </h3>
                    <div className="flex space-x-2">
                      <input
                        value={newRequirement}
                        onChange={(e) => setNewRequirement(e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-white placeholder-gray-400 transition-all"
                        placeholder="e.g., Tech niche, English content, Regular uploads"
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addRequirement())
                        }
                      />
                      <button
                        type="button"
                        onClick={addRequirement}
                        className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>

                    {requirements.length > 0 && (
                      <div className="space-y-2 mt-4">
                        {requirements.map((req, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-700/30 px-4 py-2 rounded-lg border border-gray-600"
                          >
                            <span className="text-gray-300">{req}</span>
                            <button
                              type="button"
                              onClick={() => removeRequirement(index)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {errors.requirements && (
                      <p className="text-red-400 text-sm mt-2">
                        {errors.requirements.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 sticky top-8">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Task Summary
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform</span>
                    <span className="text-white">YouTube</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Budget</span>
                    <span className="text-white">${watch("budget") || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min Subscribers</span>
                    <span className="text-white">
                      {(watch("minSubscribers") || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min Likes</span>
                    <span className="text-white">
                      {(watch("minLikes") || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Additional Requirements
                    </span>
                    <span className="text-white">{requirements.length}</span>
                  </div>
                </div>

                <div className="border-t border-gray-700 mt-4 pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-300">Total Cost</span>
                    <span className="text-white">${watch("budget") || 0}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Funds will be held in escrow until task completion
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!wallet?.connected || isSubmitting}
                  className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating Task..." : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        </form>
        <div onClick={handleTest}>测试合约</div>
      </motion.div>
    </div>
  );
}
