import React from 'react';
import SEO from "@/components/SEO";
import Breadcrumb from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MyProfile: React.FC = () => {
    return (
        <>
            <SEO
                title="My Profile"
                description="Manage your profile and account settings at A2Z BOOKSHOP. Update your personal information, view your order history, and more."
                keywords="my profile, account settings, personal information, order history"
                url="https://a2zbookshop.com/my-profile"
                type="website"
            />
            <div className="min-h-screen bg-gray-50">
                <div className="container-custom">
                    <Breadcrumb items={[{ label: "My Profile" }]} />

                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                                🚧 My Profile Page 🚧
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-2">
                            <p className="text-lg text-gray-600">
                                This section is under development.
                            </p>
                            <p className="text-lg text-gray-600">
                                We're crafting something awesome for you!
                            </p>
                            <p className="text-lg text-gray-600">
                                Stay tuned and check back soon for your personalized profile experience. ✨
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default MyProfile;