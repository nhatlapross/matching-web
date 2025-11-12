"use client";

import CardWrapper from "@/components/CardWrapper";
import {
  type ProfileSchema,
  profileSchema,
} from "@/lib/schemas/RegisterSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormProvider,
  useForm,
} from "react-hook-form";
import { RiProfileLine } from "react-icons/ri";
import ProfileForm from "../register/ProfileDetailsForm";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, Card, CardBody, Image } from "@nextui-org/react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useCurrentAccount, useSuiClientContext } from "@mysten/dapp-kit";
import { buildCreateProfileTransaction, fetchProfileRegistryReference } from "@/lib/contracts/matchingMe";
import { markProfileCompleteOnChain } from "@/app/actions/profileOnChainActions";
import { completeSocialLoginProfile } from "@/app/actions/authActions";
import { calculateAge } from "@/lib/util";
import { isContractConfigured } from "@/configs/matchingMeContract";
import { getProfileIdByAddress, getProfileInfo } from "@/lib/blockchain/contractQueries";
import { useSponsoredTransaction } from "@/hooks/useSponsoredTransaction";
import { toast } from "react-toastify";
import { isEvmAddress } from "@/lib/walletUtils";
import LivenessCameraCapture from "@/components/face-verification/LivenessCameraCapture";
import { extractFaceDescriptor } from "@/utils/faceVerification";
import { Video, CheckCircle } from "lucide-react";
import AvatarUploadWithVerification from "@/components/AvatarUploadWithVerification";

interface EncryptionResponse {
  ciphertext: string;
  policyId: string;
  keyId: string;
}

export default function CompleteProfileForm() {
  // Step management
  const [currentStep, setCurrentStep] = useState<'face-verification' | 'profile-form'>('face-verification');
  
  // Face verification state
  const [referenceFaceImage, setReferenceFaceImage] = useState<string | null>(null);
  const [referenceFaceDescriptor, setReferenceFaceDescriptor] = useState<any>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  
  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFaceSwapped, setAvatarFaceSwapped] = useState<boolean>(false);
  
  // Interests state
  const [interests, setInterests] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const methods = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setError,
    clearErrors,
  } = methods;

  const { update, data: session } = useSession();
  const account = useCurrentAccount();
  const { client } = useSuiClientContext();

  // Check if current user is using EVM wallet
  const userWalletAddress = session?.user?.id || '';
  const isEvmWallet = isEvmAddress(userWalletAddress);
  
  // Use Enoki-sponsored transactions
  const { executeSponsored, isLoading: isSponsoredLoading } = useSponsoredTransaction({
    onSuccess: (digest) => {
      console.log('✅ Sponsored transaction executed:', digest);
    },
    showToasts: true,
  });

  // Load face-api.js models for face verification
  useEffect(() => {
    const initModels = async () => {
      try {
        console.log('Starting to load face-api.js models...')
        const faceapi = await import('face-api.js')
        const MODEL_URL = '/models'
        
        // Only load models if not already loaded
        const modelsToLoad = []
        
        if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
          console.log('Loading ssdMobilenetv1...')
          modelsToLoad.push(faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL))
        }
        if (!faceapi.nets.faceLandmark68Net.isLoaded) {
          console.log('Loading faceLandmark68Net...')
          modelsToLoad.push(faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL))
        }
        if (!faceapi.nets.faceRecognitionNet.isLoaded) {
          console.log('Loading faceRecognitionNet...')
          modelsToLoad.push(faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL))
        }
        
        if (modelsToLoad.length > 0) {
          console.log(`Loading ${modelsToLoad.length} models...`)
          await Promise.all(modelsToLoad)
          console.log('✅ Face models loaded successfully')
        } else {
          console.log('✅ Face models already loaded')
        }
      } catch (err) {
        console.error('Failed to load models:', err)
        // Show more detailed error
        if (err instanceof Error) {
          console.error('Error details:', err.message, err.stack)
        }
        toast.error('Error loading AI models. Please refresh the page.')
      } finally {
        setIsLoadingModel(false)
      }
    }
    initModels()
  }, [])

  // Handle camera capture
  const handleCameraCapture = async (capturedImageUrl: string) => {
    setReferenceFaceImage(capturedImageUrl)
    setIsCameraOpen(false)

    try {
      const descriptor = await extractFaceDescriptor(capturedImageUrl)
      if (descriptor) {
        setReferenceFaceDescriptor(descriptor)
        toast.success('✅ Real person verified and reference face saved!')
        // Move to profile form step
        setCurrentStep('profile-form')
      } else {
        toast.error('❌ No clear face detected')
        setReferenceFaceImage(null)
      }
    } catch (error) {
      console.error('Error processing reference face:', error)
      toast.error('Error processing reference image')
      setReferenceFaceImage(null)
    }
  }

  // Handle avatar upload
  const handleAvatarSelect = (file: File, faceSwapped: boolean) => {
    setAvatarFile(file)
    setAvatarFaceSwapped(faceSwapped)
    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)
    toast.success('✅ Avatar selected and verified')
  }

  const handleAvatarRemove = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarFaceSwapped(false)
  }
  
  const onSubmit = async (
    data: ProfileSchema
  ) => {
    setIsLoading(true);
    try {
      clearErrors("root");

      // Validate reference face
      if (!referenceFaceImage || !referenceFaceDescriptor) {
        setError("root.serverError", {
          message: "Please complete face verification first",
        });
        setIsLoading(false);
        return;
      }

      // Avatar already verified by AvatarUploadWithVerification component
      // No need to verify again here

      // Check if smart contract is configured
      const contractEnabled = isContractConfigured();

      // EVM wallets skip onchain profile creation
      if (!isEvmWallet && contractEnabled && !account?.address) {
        setError("root.serverError", {
          message: "Connect your Sui wallet before completing your profile.",
        });
        setIsLoading(false);
        return;
      }

      const age = calculateAge(new Date(data.dateOfBirth));

      if (age < 18) {
        setError("root.serverError", {
          message: "You must be at least 18 years old to create a profile.",
        });
        setIsLoading(false);
        return;
      }

      // Helper function to convert data URL to Blob
      const dataURLtoBlob = (dataURL: string): Blob => {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      };

      // Upload reference face image first
      let referenceFaceUrl = referenceFaceImage;
      if (referenceFaceImage.startsWith('data:')) {
        // Convert base64 to blob without using fetch (to avoid CSP issues)
        const blob = dataURLtoBlob(referenceFaceImage);
        
        const formData = new FormData();
        formData.append('file', blob, 'reference-face.jpg');
        
        const uploadResponse = await fetch('/api/upload-reference-face', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload reference face');
        }

        const uploadResult = await uploadResponse.json();
        referenceFaceUrl = uploadResult.url;
      }

      // Upload avatar if provided
      let avatarUrl = null;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        
        const uploadResponse = await fetch('/api/upload-avatar', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload avatar');
        }

        const uploadResult = await uploadResponse.json();
        avatarUrl = uploadResult.url;
      }

      // Complete off-chain profile with reference face and avatar
      const profileData = {
        ...data,
        referenceFaceUrl,
        referenceFaceDescriptor: JSON.stringify(Array.from(referenceFaceDescriptor.descriptor)),
        avatarUrl,
        interests,
        avatarFaceSwapped, // Track if avatar was face-swapped
      };
      
      const result = await completeSocialLoginProfile(profileData as any);

      if (result.status !== 'success') {
        const errorMessage = Array.isArray(result.error)
          ? result.error.map(e => e.message).join(', ')
          : result.error || 'Failed to complete profile';
        throw new Error(errorMessage);
      }

      // EVM wallets skip on-chain profile creation entirely
      if (isEvmWallet) {
        console.log('✅ EVM wallet detected - skipping on-chain profile creation');

        await update({ profileComplete: true });

        // Small delay to ensure session is updated
        await new Promise(resolve => setTimeout(resolve, 300));

        // Redirect and let middleware handle the rest
        window.location.href = "/members";
        return;
      }

      // Continue with on-chain profile creation for Sui wallets
      if (!account?.address) {
        throw new Error('Wallet not connected');
      }

      // Check if user already has a profile on-chain
      let profileObjectId = await getProfileIdByAddress(client, account.address);

      if (profileObjectId) {
        // Profile exists - sync existing data
        console.log('✅ Existing on-chain profile found:', profileObjectId);

        const existingProfile = await getProfileInfo(client, profileObjectId);

        if (existingProfile) {
          console.log('📦 Syncing existing profile data:', {
            displayName: existingProfile.displayName,
            age: existingProfile.age,
            interests: existingProfile.interests,
          });

          // Mark as complete with existing profile
          const markResult = await markProfileCompleteOnChain({
            profileObjectId,
            // Don't pass seal params - use existing ones
          });

          if (markResult.status !== "success") {
            throw new Error(markResult.error);
          }
        }
      } else {
        // No profile exists - create new one
        console.log('🆕 No on-chain profile found, creating new...');

        const encryptionResponse = await fetch("/api/profile/encrypt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: buildProfilePayload(data),
            ownerAddress: account.address,
          }),
        });

        if (!encryptionResponse.ok) {
          const errorBody = await safeParseError(encryptionResponse);
          throw new Error(errorBody ?? "Failed to encrypt profile data");
        }

        const encrypted: EncryptionResponse = await encryptionResponse.json();

        const registry = await fetchProfileRegistryReference(client);

        const transaction = buildCreateProfileTransaction({
          ownerAddress: account.address,
          displayName: data.name,
          age,
          encryptedPayload: encrypted.ciphertext,
          interests: deriveInterests(data),
          registry,
        });

        // Execute with Enoki sponsorship
        const executionResult = await executeSponsored(transaction, {
          allowedMoveCallTargets: [
            `${process.env.NEXT_PUBLIC_PACKAGE_ID}::core::create_profile`,
          ],
        });

        if (!executionResult.success || !executionResult.digest) {
          throw new Error('Failed to create profile on-chain');
        }

        // Wait for transaction to be indexed
        await client.waitForTransaction({
          digest: executionResult.digest,
          options: { showObjectChanges: true },
        });

        // Query the created profile object ID
        profileObjectId = await getProfileIdByAddress(client, account.address);

        if (!profileObjectId) {
          throw new Error("Profile created but object ID could not be determined.");
        }

        const markResult = await markProfileCompleteOnChain({
          profileObjectId,
          sealPolicyId: encrypted.policyId,
          sealKeyId: encrypted.keyId,
        });

        if (markResult.status !== "success") {
          throw new Error(markResult.error);
        }

        console.log('✅ New on-chain profile created:', profileObjectId);
      }

      await update({ profileComplete: true });

      // Small delay to ensure session is updated
      await new Promise(resolve => setTimeout(resolve, 300));

      // Redirect and let middleware handle the rest
      window.location.href = "/members";
    } catch (error) {
      console.error("Error completing profile:", error);
      setError("root.serverError", {
        message:
          error instanceof Error ? error.message : "Something went wrong while completing your profile.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render face verification step
  if (currentStep === 'face-verification') {
    if (isLoadingModel) {
      return (
        <CardWrapper
          headerText="Loading..."
          subHeaderText="Please wait"
          headerIcon={RiProfileLine}
          body={
            <Card>
              <CardBody className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading AI models...</p>
              </CardBody>
            </Card>
          }
        />
      );
    }

    return (
      <CardWrapper
        headerText="Verify Real Person"
        subHeaderText="For security, please verify your face to protect the community"
        headerIcon={RiProfileLine}
        body={
          <div className="space-y-6">
            {referenceFaceImage ? (
              <Card>
                <CardBody className="space-y-4">
                  <div className="relative">
                    <Image 
                      src={referenceFaceImage} 
                      alt="Reference Face" 
                      className="w-full rounded-lg"
                    />
                    <div className="absolute top-2 left-2 z-10">
                      <div className="bg-success text-white text-xs px-2 py-1 rounded flex items-center gap-1 shadow-lg">
                        <CheckCircle className="h-3 w-3" />
                        Real person verified
                      </div>
                    </div>
                  </div>
                  <Button
                    color="primary"
                    size="lg"
                    fullWidth
                    onPress={() => setCurrentStep('profile-form')}
                  >
                    Continue to profile
                  </Button>
                  <Button
                    color="default"
                    variant="flat"
                    size="lg"
                    fullWidth
                    onPress={() => {
                      setReferenceFaceImage(null);
                      setReferenceFaceDescriptor(null);
                    }}
                  >
                    Retake photo
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody className="space-y-4">
                  <div className="text-center py-6">
                    <div className="text-6xl mb-4">🎥</div>
                    <h3 className="text-xl font-bold mb-2">Face Verification</h3>
                    <p className="text-default-600 mb-4">
                      We need to verify you are a real person to protect our community
                    </p>
                    <Button
                      color="success"
                      size="lg"
                      startContent={<Video className="h-5 w-5" />}
                      onPress={() => setIsCameraOpen(true)}
                    >
                      Start Verification
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Camera Modal */}
            <Modal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              size="3xl"
              closeButton
              isDismissable={false}
            >
              <ModalContent>
                <ModalHeader>
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-success" />
                    <span>Verify Real Person</span>
                  </div>
                </ModalHeader>
                <ModalBody className="pb-6">
                  <LivenessCameraCapture
                    onCaptureComplete={handleCameraCapture}
                    onCancel={() => setIsCameraOpen(false)}
                  />
                </ModalBody>
              </ModalContent>
            </Modal>
          </div>
        }
      />
    );
  }

  // Render profile form step
  return (
    <CardWrapper
      headerText="Complete Your Profile"
      subHeaderText="Please fill in your information"
      headerIcon={RiProfileLine}
      body={
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Avatar + Interests */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Avatar Upload Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Avatar (optional)</label>
                    {referenceFaceDescriptor ? (
                      <AvatarUploadWithVerification
                        onFileSelect={handleAvatarSelect}
                        currentPreview={avatarPreview}
                        onRemove={handleAvatarRemove}
                        referenceFaceDescriptor={referenceFaceDescriptor}
                      />
                    ) : (
                      <div className="text-xs text-warning">
                        Please complete face verification first
                      </div>
                    )}
                    <p className="text-xs text-default-500">
                      Avatar will be verified against your reference face
                    </p>
                  </div>

                  {/* Interests Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interests</label>
                    <textarea
                      className="w-full px-3 py-2 border border-default-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={6}
                      placeholder="Travel, Reading, Sports, Music, Cooking..."
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                    />
                    <p className="text-xs text-default-500">
                      Separate interests with commas. These will be used for matching.
                    </p>
                  </div>
                </div>

                {/* Right Column: Profile Form Fields */}
                <div className="lg:col-span-2">
                  <ProfileForm />
                </div>
              </div>

              {/* Error Message */}
              {errors.root?.serverError && (
                <p className="text-danger text-sm">
                  {errors.root.serverError.message}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 pt-2">
                <Button
                  isLoading={isLoading || isSubmitting}
                  isDisabled={!isValid || isLoading}
                  fullWidth
                  color="default"
                  type="submit"
                  size="lg"
                >
                  Complete Profile
                </Button>
                <Button
                  color="default"
                  variant="flat"
                  fullWidth
                  onPress={() => setCurrentStep('face-verification')}
                  isDisabled={isLoading || isSubmitting}
                >
                  Back
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      }
    />
  );
}

function buildProfilePayload(data: ProfileSchema) {
  return {
    name: data.name,
    gender: data.gender,
    description: data.description,
    city: data.city,
    country: data.country,
    dateOfBirth: data.dateOfBirth,
    createdAt: new Date().toISOString(),
  };
}

function deriveInterests(data: ProfileSchema): string[] {
  const base = [data.gender, data.city, data.country];
  const descriptionTokens = data.description
    .split(/[,\n]/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const unique = Array.from(
    new Set([...base, ...descriptionTokens].map((interest) => interest.toLowerCase())),
  ).filter((interest) => interest.length > 0);

  while (unique.length < 3) {
    unique.push(`interest-${unique.length + 1}`);
  }

  return unique;
}

async function safeParseError(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? null;
  } catch (error) {
    console.warn("Failed to parse error response", error);
    return null;
  }
}

